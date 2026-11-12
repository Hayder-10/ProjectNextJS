import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { shopBalance, shopSales } from '@/lib/commission';
import { toPlain } from '@/lib/utils';
import type { OrderItem, ProductItem } from '@/lib/queries/shop';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Order from '@/models/Order';
import '@/models/User';

export type ShopStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ShopItem = {
  _id: string;
  owner: string;
  name: string;
  description: string;
  city: string;
  logoUrl?: string;
  status: ShopStatus;
  rejectionReason?: string;
  createdAt: string;
};

export async function getMyShop(userId: string) {
  await connectDB();
  const shop = await Shop.findOne({ owner: userId }).lean();
  return shop ? toPlain<ShopItem>(shop) : null;
}

export async function getPublicShop(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const shop = await Shop.findOne({ _id: id, status: 'approved' }).lean();
  return shop ? toPlain<ShopItem>(shop) : null;
}

export async function listOpenShops() {
  await connectDB();
  const shops = await Shop.find({ status: 'approved' }).sort({ name: 1 }).lean();
  return toPlain<ShopItem[]>(shops);
}

export async function listShopProducts(shopId: string) {
  await connectDB();
  const products = await Product.find({ shop: shopId }).sort({ createdAt: -1 }).populate('shop', 'name status').lean();
  return toPlain<ProductItem[]>(products);
}

export async function getShopProduct(shopId: string, productId: string) {
  if (!isValidObjectId(productId)) return null;
  await connectDB();
  const product = await Product.findOne({ _id: productId, shop: shopId }).lean();
  return product ? toPlain<ProductItem>(product) : null;
}

export async function listShopOrders(shopId: string) {
  await connectDB();
  const orders = await Order.find({ shop: shopId }).sort({ createdAt: -1 }).limit(200).populate('buyer', 'name email').lean();
  return toPlain<OrderItem[]>(orders);
}

/** Chiffres d'une boutique : ventes, commission et solde restant à régler */
export async function getShopFigures(shopId: string) {
  await connectDB();
  const orders = await Order.find({ shop: shopId }).select('total status paymentMethod paymentStatus commissionAmount sellerAmount settledAt').lean();
  const plain = toPlain<Parameters<typeof shopBalance>[0]>(orders);
  return { ...shopSales(plain), ...withoutCount(shopBalance(plain)), pendingOrders: plain.filter((o) => o.status === 'pending').length };
}

function withoutCount({ balance, ordersCount }: ReturnType<typeof shopBalance>) {
  return { balance, ordersToSettle: ordersCount };
}

export type AdminShopItem = Omit<ShopItem, 'owner'> & {
  owner: { _id: string; name: string; email: string } | null;
  productsCount: number;
  figures: Awaited<ReturnType<typeof getShopFigures>>;
};

export async function listShopsForAdmin(status?: string) {
  await connectDB();
  const shops = await Shop.find(status ? { status } : {}).sort({ status: 1, createdAt: -1 }).limit(200).populate('owner', 'name email').lean();
  const rows = await Promise.all(
    shops.map(async (shop) => ({
      ...shop,
      productsCount: await Product.countDocuments({ shop: shop._id }),
      figures: await getShopFigures(String(shop._id)),
    })),
  );
  return toPlain<AdminShopItem[]>(rows);
}
