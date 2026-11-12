import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { escapeRegex, toPlain } from '@/lib/utils';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Shop from '@/models/Shop';
import '@/models/User';

export type ProductItem = {
  _id: string;
  name: string;
  description: string;
  category: 'jerseys' | 'boots' | 'balls' | 'training' | 'accessories';
  price: number;
  stock: number;
  imageUrl?: string;
  shop?: { _id: string; name: string; status: string } | null;
  createdAt: string;
};

export type OrderItem = {
  _id: string;
  buyer: { _id: string; name: string; email: string } | string | null; // objet seulement dans listAllOrders (populate)
  items: { product: string; name: string; price: number; quantity: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  shippingAddress: string;
  phone: string;
  paymentMethod?: 'cash' | 'online';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  stripeSessionId?: string;
  shop?: string;
  shopName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  sellerAmount?: number;
  settledAt?: string;
  createdAt: string;
};

/** Les produits d'une boutique suspendue disparaissent du site */
async function visibleProductsFilter() {
  const hidden = await Shop.find({ status: { $ne: 'approved' } }).distinct('_id');
  return hidden.length > 0 ? { shop: { $nin: hidden } } : {};
}

export async function listProducts({ category, q, includeHidden = false }: { category?: string; q?: string; includeHidden?: boolean } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = includeHidden ? {} : await visibleProductsFilter();
  if (category) filter.category = category;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
  const products = await Product.find(filter).sort({ createdAt: -1 }).populate('shop', 'name status').lean();
  return toPlain<ProductItem[]>(products);
}

export async function getLatestProducts(limit = 3) {
  await connectDB();
  const products = await Product.find(await visibleProductsFilter()).sort({ createdAt: -1 }).limit(limit).lean();
  return toPlain<ProductItem[]>(products);
}

export async function getProduct(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const product = await Product.findById(id).populate('shop', 'name status').lean();
  return product ? toPlain<ProductItem>(product) : null;
}

export async function listMyOrders(userId: string) {
  await connectDB();
  const orders = await Order.find({ buyer: userId }).sort({ createdAt: -1 }).lean();
  return toPlain<OrderItem[]>(orders);
}

export async function listAllOrders() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200).populate('buyer', 'name email').lean();
  return toPlain<OrderItem[]>(orders);
}
