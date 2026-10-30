import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { escapeRegex, toPlain } from '@/lib/utils';
import Product from '@/models/Product';
import Order from '@/models/Order';
import '@/models/User';

export type ProductItem = {
  _id: string;
  name: string;
  description: string;
  category: 'jerseys' | 'boots' | 'balls' | 'training' | 'accessories';
  price: number;
  stock: number;
  imageUrl?: string;
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
  createdAt: string;
};

export async function listProducts({ category, q }: { category?: string; q?: string } = {}) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return toPlain<ProductItem[]>(products);
}

export async function getLatestProducts(limit = 3) {
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 }).limit(limit).lean();
  return toPlain<ProductItem[]>(products);
}

export async function getProduct(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const product = await Product.findById(id).lean();
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
