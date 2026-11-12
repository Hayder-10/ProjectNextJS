'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { splitSale } from '@/lib/commission';
import { orderItemsSchema, orderSchema, ORDER_STATUSES, productSchema } from '@/lib/validation/shop';
import { firstError, objectId } from '@/lib/validation/common';
import { notifyOrders } from '@/lib/email';
import { cancelOrderAndSettle, createCheckout, releaseExpiredPayments, restoreStock } from '@/lib/payments';
import { isOnlinePaymentEnabled, toStripeAmount } from '@/lib/stripe';
import { round3, type ActionResult } from '@/lib/utils';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Shop from '@/models/Shop';

function revalidateShop() {
  revalidatePath('/shop');
  revalidatePath('/admin/products');
  revalidatePath('/');
}

// ---------- Produits (admin) ----------

export async function createProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const { imageUrl, price, ...rest } = parsed.data;
  await Product.create({ ...rest, price: round3(price), imageUrl: imageUrl || undefined });
  revalidateShop();
  redirect('/admin/products?saved=created');
}

export async function updateProduct(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Produit introuvable' };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const product = await Product.findById(id);
  if (!product) return { ok: false, error: 'Produit introuvable' };

  const { imageUrl, price, ...rest } = parsed.data;
  product.set({ ...rest, price: round3(price), imageUrl: imageUrl || undefined });
  await product.save();
  revalidateShop();
  revalidatePath(`/shop/${id}`);
  redirect('/admin/products?saved=updated');
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Produit introuvable' };

  await connectDB();
  await Product.findByIdAndDelete(id);
  revalidateShop();
  return { ok: true };
}

// ---------- Commandes ----------

export async function placeOrder(items: { productId: string; quantity: number }[], formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsedItems = orderItemsSchema.safeParse(items);
  if (!parsedItems.success) return { ok: false, error: firstError(parsedItems.error) };
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.paymentMethod === 'online' && !isOnlinePaymentEnabled()) return { ok: false, error: 'Le paiement en ligne est indisponible' };

  await connectDB();
  await releaseExpiredPayments();

  // On recharge chaque produit depuis la base : on ne fait jamais confiance aux prix du panier
  type OrderLine = { product: unknown; name: string; price: number; quantity: number };
  const orderItems: OrderLine[] = [];
  // Une commande par vendeur : la clé est l'id de la boutique, '' pour FootHub
  const sellers = new Map<string, { shop?: unknown; shopName?: string; items: OrderLine[] }>();
  for (const item of parsedItems.data) {
    const product = await Product.findById(item.productId);
    if (!product) return { ok: false, error: 'Un produit du panier n\'existe plus' };
    if (product.stock < item.quantity) {
      return { ok: false, error: `Stock insuffisant pour « ${product.name} » (${product.stock} disponible(s))` };
    }
    const key = product.shop ? String(product.shop) : '';
    if (!sellers.has(key)) {
      const shop = key ? await Shop.findOne({ _id: key, status: 'approved' }).select('name') : null;
      if (key && !shop) return { ok: false, error: `« ${product.name} » n'est plus disponible : sa boutique est fermée` };
      sellers.set(key, { shop: shop?._id, shopName: shop?.name, items: [] });
    }
    const orderItem = { product: product._id, name: product.name, price: product.price, quantity: item.quantity };
    orderItems.push(orderItem);
    sellers.get(key)!.items.push(orderItem);
  }

  // Diminue le stock ; la condition stock >= quantité évite de passer sous zéro si deux commandes arrivent en même temps
  const done: typeof orderItems = [];
  for (const item of orderItems) {
    const result = await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
    if (result.modifiedCount === 0) {
      // Annule les diminutions déjà faites
      for (const d of done) await Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } });
      return { ok: false, error: `Stock insuffisant pour « ${item.name} »` };
    }
    done.push(item);
  }

  const orders = [];
  for (const { shop, shopName, items } of sellers.values()) {
    const total = round3(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    orders.push(
      await Order.create({
        buyer: user.id,
        items,
        total,
        ...parsed.data,
        // Le montant débité vient de la somme de ces parts : chacune reste remboursable exactement
        ...(parsed.data.paymentMethod === 'online' ? { stripeAmount: toStripeAmount(total) } : {}),
        ...(shop ? { shop, shopName, ...splitSale(total) } : {}),
      }),
    );
  }

  let redirectUrl: string | undefined;
  if (parsed.data.paymentMethod === 'online') {
    try {
      redirectUrl = await createCheckout({
        kind: 'order',
        ids: orders.map((o) => String(o._id)),
        userId: user.id,
        email: user.email,
        label: 'Commande FootHub',
        stripeAmount: orders.reduce((sum, o) => sum + o.stripeAmount, 0),
      });
    } catch (err) {
      // Sans page de paiement, la commande ne peut pas aboutir : on rend le stock
      console.error('[stripe] Échec de la création du paiement :', err);
      await Order.deleteMany({ _id: { $in: orders.map((o) => o._id) } });
      await restoreStock(orderItems);
      revalidateShop();
      return { ok: false, error: 'Le paiement en ligne a échoué. Réessayez ou choisissez le paiement à la livraison.' };
    }
  } else {
    await notifyOrders(orders);
  }

  revalidateShop();
  revalidatePath('/shop/orders');
  return { ok: true, redirectUrl };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(orderId).success) return { ok: false, error: 'Commande introuvable' };

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, error: 'Commande introuvable' };
  if (order.buyer.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };
  // Une commande payée passe directement à « confirmée » : elle reste annulable tant qu'elle n'est pas expédiée
  const cancellable = order.status === 'pending' || (order.status === 'confirmed' && order.paymentStatus === 'paid');
  if (!cancellable) return { ok: false, error: 'Cette commande ne peut plus être annulée' };

  const paymentError = await cancelOrderAndSettle(order);
  if (paymentError) return { ok: false, error: paymentError };

  revalidateShop();
  revalidatePath('/shop/orders');
  return { ok: true };
}

/** Change le statut d'une commande : réservé à l'admin et au vendeur concerné */
export async function setOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(orderId).success) return { ok: false, error: 'Commande introuvable' };
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return { ok: false, error: 'Statut invalide' };

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, error: 'Commande introuvable' };

  const isAdmin = user.role === 'admin';
  const isSeller = !!order.shop && (await Shop.exists({ _id: order.shop, owner: user.id }));
  if (!isAdmin && !isSeller) return { ok: false, error: 'Action non autorisée' };

  if (order.status === 'cancelled') return { ok: false, error: 'Une commande annulée ne peut plus changer de statut' };
  if (order.settledAt) return { ok: false, error: 'Cette commande est déjà réglée avec le vendeur' };
  if (!isAdmin && order.status === 'shipped') return { ok: false, error: 'Cette commande est déjà expédiée' };
  if (status !== 'cancelled' && status !== 'pending' && order.paymentMethod === 'online' && order.paymentStatus !== 'paid') {
    return { ok: false, error: "Cette commande n'est pas encore payée" };
  }
  if (status === 'cancelled') {
    const paymentError = await cancelOrderAndSettle(order);
    if (paymentError) return { ok: false, error: paymentError };
  } else {
    order.status = status;
    await order.save();
  }

  revalidateShop();
  revalidatePath('/shop/orders');
  revalidatePath('/seller/orders');
  revalidatePath('/seller');
  return { ok: true };
}
