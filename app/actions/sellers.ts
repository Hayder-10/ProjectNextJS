'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAdmin, requireUser, type SessionUser } from '@/lib/auth';
import { sendShopDecision } from '@/lib/email';
import { firstError, objectId } from '@/lib/validation/common';
import { productSchema } from '@/lib/validation/shop';
import { rejectShopSchema, shopSchema } from '@/lib/validation/shops';
import { escapeRegex, round3, type ActionResult } from '@/lib/utils';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Order from '@/models/Order';

function revalidateShops(shopId?: string) {
  revalidatePath('/shop');
  revalidatePath('/shop/boutiques');
  revalidatePath('/seller');
  revalidatePath('/seller/products');
  revalidatePath('/admin/shops');
  revalidatePath('/');
  if (shopId) revalidatePath(`/shop/boutiques/${shopId}`);
}

// ---------- Boutique (vendeur) ----------

/** Crée la boutique, ou la modifie. Une boutique refusée repart en validation. */
export async function saveShop(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { logoUrl, ...rest } = parsed.data;

  await connectDB();
  const shop = await Shop.findOne({ owner: user.id });
  if (shop?.status === 'suspended') return { ok: false, error: 'Votre boutique est suspendue : contactez un administrateur' };

  const sameName = await Shop.exists({ name: { $regex: `^${escapeRegex(rest.name)}$`, $options: 'i' }, ...(shop ? { _id: { $ne: shop._id } } : {}) });
  if (sameName) return { ok: false, error: 'Ce nom de boutique est déjà pris' };

  if (shop) {
    shop.set({ ...rest, logoUrl: logoUrl || undefined });
    if (shop.status === 'rejected') shop.set({ status: 'pending', rejectionReason: undefined });
    await shop.save();
  } else {
    await Shop.create({ ...rest, logoUrl: logoUrl || undefined, owner: user.id });
  }
  revalidateShops(shop ? String(shop._id) : undefined);
  redirect('/seller');
}

// ---------- Produits (vendeur) ----------

/** Seul le propriétaire d'une boutique ouverte peut gérer des produits */
async function loadOpenShop(user: SessionUser) {
  await connectDB();
  const shop = await Shop.findOne({ owner: user.id, status: 'approved' });
  return shop;
}

export async function createSellerProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const shop = await loadOpenShop(user);
  if (!shop) return { ok: false, error: "Votre boutique n'est pas ouverte" };

  const { imageUrl, price, ...rest } = parsed.data;
  await Product.create({ ...rest, price: round3(price), imageUrl: imageUrl || undefined, shop: shop._id });
  revalidateShops(String(shop._id));
  redirect('/seller/products?saved=created');
}

export async function updateSellerProduct(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Produit introuvable' };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const shop = await loadOpenShop(user);
  if (!shop) return { ok: false, error: "Votre boutique n'est pas ouverte" };
  const product = await Product.findOne({ _id: id, shop: shop._id });
  if (!product) return { ok: false, error: 'Produit introuvable' };

  const { imageUrl, price, ...rest } = parsed.data;
  product.set({ ...rest, price: round3(price), imageUrl: imageUrl || undefined });
  await product.save();
  revalidateShops(String(shop._id));
  revalidatePath(`/shop/${id}`);
  redirect('/seller/products?saved=updated');
}

export async function deleteSellerProduct(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Produit introuvable' };

  await connectDB();
  const shop = await Shop.findOne({ owner: user.id });
  if (!shop) return { ok: false, error: 'Action non autorisée' };
  const result = await Product.deleteOne({ _id: id, shop: shop._id });
  if (result.deletedCount === 0) return { ok: false, error: 'Produit introuvable' };

  revalidateShops(String(shop._id));
  return { ok: true };
}

// ---------- Validation et règlements (admin) ----------

export async function approveShop(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Boutique introuvable' };

  await connectDB();
  const shop = await Shop.findById(id);
  if (!shop) return { ok: false, error: 'Boutique introuvable' };
  shop.set({ status: 'approved', rejectionReason: undefined });
  await shop.save();
  await sendShopDecision(shop, 'approved');
  revalidateShops(id);
  return { ok: true };
}

export async function rejectShop(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Boutique introuvable' };
  const parsed = rejectShopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  await connectDB();
  const shop = await Shop.findById(id);
  if (!shop) return { ok: false, error: 'Boutique introuvable' };
  if (shop.status !== 'pending') return { ok: false, error: 'Seule une boutique en attente peut être refusée' };
  shop.set({ status: 'rejected', rejectionReason: parsed.data.reason });
  await shop.save();
  await sendShopDecision(shop, 'rejected', parsed.data.reason);
  revalidateShops(id);
  return { ok: true };
}

/** Une boutique suspendue disparaît du site, ses commandes en cours restent suivies */
export async function suspendShop(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Boutique introuvable' };

  await connectDB();
  const shop = await Shop.findById(id);
  if (!shop) return { ok: false, error: 'Boutique introuvable' };
  shop.status = 'suspended';
  await shop.save();
  await sendShopDecision(shop, 'suspended');
  revalidateShops(id);
  return { ok: true };
}

/** Note que le solde a été réglé en dehors du site : les commandes expédiées sortent du calcul */
export async function settleShop(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Boutique introuvable' };

  await connectDB();
  const result = await Order.updateMany({ shop: id, status: 'shipped', settledAt: { $exists: false } }, { settledAt: new Date() });
  if (result.modifiedCount === 0) return { ok: false, error: 'Rien à régler pour cette boutique' };
  revalidateShops(id);
  revalidatePath('/seller/orders');
  return { ok: true };
}
