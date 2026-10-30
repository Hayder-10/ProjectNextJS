'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { orderItemsSchema, orderSchema, ORDER_STATUSES, productSchema } from '@/lib/validation/shop';
import { firstError, objectId } from '@/lib/validation/common';
import { round3, type ActionResult } from '@/lib/utils';
import Product from '@/models/Product';
import Order from '@/models/Order';

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

  await connectDB();

  // On recharge chaque produit depuis la base : on ne fait jamais confiance aux prix du panier
  const orderItems = [];
  for (const item of parsedItems.data) {
    const product = await Product.findById(item.productId);
    if (!product) return { ok: false, error: 'Un produit du panier n\'existe plus' };
    if (product.stock < item.quantity) {
      return { ok: false, error: `Stock insuffisant pour « ${product.name} » (${product.stock} disponible(s))` };
    }
    orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity });
  }
  const total = round3(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0));

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

  await Order.create({ buyer: user.id, items: orderItems, total, ...parsed.data });
  revalidateShop();
  revalidatePath('/shop/orders');
  return { ok: true };
}

async function restoreStock(items: { product: unknown; quantity: number }[]) {
  for (const item of items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(orderId).success) return { ok: false, error: 'Commande introuvable' };

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, error: 'Commande introuvable' };
  if (order.buyer.toString() !== user.id && user.role !== 'admin') return { ok: false, error: 'Action non autorisée' };
  if (order.status !== 'pending') return { ok: false, error: 'Seule une commande en attente peut être annulée' };

  order.status = 'cancelled';
  await order.save();
  await restoreStock(order.items);
  revalidateShop();
  revalidatePath('/shop/orders');
  return { ok: true };
}

export async function adminSetOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(orderId).success) return { ok: false, error: 'Commande introuvable' };
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return { ok: false, error: 'Statut invalide' };

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, error: 'Commande introuvable' };
  if (order.status === 'cancelled') return { ok: false, error: 'Une commande annulée ne peut plus changer de statut' };

  order.status = status;
  await order.save();
  if (status === 'cancelled') await restoreStock(order.items);

  revalidateShop();
  revalidatePath('/shop/orders');
  return { ok: true };
}
