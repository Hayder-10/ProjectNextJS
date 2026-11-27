import nodemailer from 'nodemailer';
import { connectDB } from '@/lib/db';
import { formatDate, formatTND } from '@/lib/utils';
import User from '@/models/User';
import Pitch from '@/models/Pitch';
import Shop from '@/models/Shop';

type Email = { to: string; subject: string; text: string; html: string };

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Un e-mail qui échoue ne doit jamais annuler une réservation ou une commande déjà enregistrée */
async function sendEmail(email: Email) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (!SMTP_HOST) {
    console.log(`[email] SMTP non configuré, envoi ignoré : « ${email.subject} » à ${email.to}`);
    return;
  }
  try {
    const port = Number(SMTP_PORT) || 587;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      // Un serveur SMTP muet ne doit pas bloquer la réservation ou le webhook Stripe
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: EMAIL_FROM || SMTP_USER, ...email });
  } catch (err) {
    console.error(`[email] Échec de l'envoi de « ${email.subject} » :`, err);
  }
}

function layout(title: string, lines: string[], linkPath: string, linkLabel: string) {
  const url = `${process.env.NEXTAUTH_URL ?? ''}${linkPath}`;
  const rows = lines.map((l) => `<p style="margin:0 0 8px">${escapeHtml(l)}</p>`).join('');
  return {
    text: [title, '', ...lines, '', `${linkLabel} : ${url}`].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;max-width:520px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#15803d">${escapeHtml(title)}</h1>
      ${rows}
      <p style="margin:20px 0 0"><a href="${escapeHtml(url)}" style="color:#15803d;font-weight:bold">${escapeHtml(linkLabel)}</a></p>
    </div>`,
  };
}

type BookingEmailData = {
  user: unknown;
  pitch: unknown;
  date: string;
  startHour: number;
  price: number;
  paymentMethod?: string;
};

export async function sendBookingConfirmation(booking: BookingEmailData) {
  await connectDB();
  const [user, pitch] = await Promise.all([User.findById(booking.user).select('email name').lean(), Pitch.findById(booking.pitch).lean()]);
  if (!user || !pitch) return;

  const title = 'Votre réservation est confirmée';
  const content = layout(
    title,
    [
      `Bonjour ${user.name},`,
      `Terrain : ${pitch.name}, ${pitch.address}, ${pitch.city}`,
      `Créneau : ${formatDate(booking.date)}, de ${booking.startHour}h à ${booking.startHour + 1}h`,
      booking.paymentMethod === 'online' ? `Payé en ligne : ${formatTND(booking.price)}` : `À payer sur place : ${formatTND(booking.price)}`,
    ],
    '/bookings',
    'Voir mes réservations',
  );
  await sendEmail({ to: user.email, subject: `FootHub · ${title}`, ...content });
}

type OrderEmailData = {
  buyer: unknown;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  shippingAddress: string;
  phone?: string;
  paymentMethod?: string;
  shop?: unknown;
  shopName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  sellerAmount?: number;
};

/** Un seul e-mail à l'acheteur pour tout son panier, et un e-mail à chaque vendeur concerné */
export async function notifyOrders(orders: OrderEmailData[]) {
  await sendOrderConfirmation(orders);
  for (const order of orders) if (order.shop) await sendSaleNotification(order);
}

async function sendOrderConfirmation(orders: OrderEmailData[]) {
  await connectDB();
  const [first] = orders;
  const items = orders.flatMap((o) => o.items);
  const total = orders.reduce((sum, o) => sum + o.total, 0);
  const user = await User.findById(first.buyer).select('email name').lean();
  if (!user) return;
  const sellers = orders.map((o) => o.shopName ?? 'FootHub');

  const title = 'Votre commande est confirmée';
  const content = layout(
    title,
    [
      `Bonjour ${user.name},`,
      ...items.map((i) => `${i.quantity} × ${i.name} : ${formatTND(i.price * i.quantity)}`),
      first.paymentMethod === 'online' ? `Payé en ligne : ${formatTND(total)}` : `À payer à la livraison : ${formatTND(total)}`,
      `Livraison : ${first.shippingAddress}`,
      ...(sellers.length > 1 ? [`Votre panier est livré séparément par : ${sellers.join(', ')}`] : []),
    ],
    '/shop/orders',
    'Voir mes commandes',
  );
  await sendEmail({ to: user.email, subject: `FootHub · ${title}`, ...content });
}

async function shopOwner(shopId: unknown) {
  const shop = await Shop.findById(shopId).select('owner name').lean();
  const owner = shop && (await User.findById(shop.owner).select('email name').lean());
  return shop && owner ? { shop, owner } : null;
}

async function sendSaleNotification(order: OrderEmailData) {
  await connectDB();
  const found = await shopOwner(order.shop);
  if (!found) return;

  const title = `Nouvelle vente sur ${found.shop.name}`;
  const content = layout(
    title,
    [
      `Bonjour ${found.owner.name},`,
      ...order.items.map((i) => `${i.quantity} × ${i.name} : ${formatTND(i.price * i.quantity)}`),
      `Total : ${formatTND(order.total)}, commission ${order.commissionRate} % : ${formatTND(order.commissionAmount ?? 0)}, votre part : ${formatTND(order.sellerAmount ?? order.total)}`,
      order.paymentMethod === 'online' ? 'Payé en ligne : FootHub vous reversera votre part.' : 'À encaisser à la livraison.',
      `Livraison : ${order.shippingAddress}${order.phone ? `, ${order.phone}` : ''}`,
    ],
    '/seller/orders',
    'Voir mes ventes',
  );
  await sendEmail({ to: found.owner.email, subject: `FootHub · ${title}`, ...content });
}

const SHOP_DECISIONS = {
  approved: { title: 'Votre boutique est ouverte', text: 'Vous pouvez maintenant ajouter vos produits.' },
  rejected: { title: "Votre demande de boutique n'a pas été acceptée", text: 'Vous pouvez corriger vos informations et renvoyer votre demande.' },
  suspended: { title: 'Votre boutique a été suspendue', text: 'Elle et ses produits ne sont plus visibles. Contactez un administrateur.' },
} as const;

export async function sendShopDecision(shop: { _id: unknown }, decision: keyof typeof SHOP_DECISIONS, reason?: string) {
  await connectDB();
  const found = await shopOwner(shop._id);
  if (!found) return;

  const { title, text } = SHOP_DECISIONS[decision];
  const content = layout(
    title,
    [`Bonjour ${found.owner.name},`, `Boutique : ${found.shop.name}`, ...(reason ? [`Motif : ${reason}`] : []), text],
    '/seller',
    'Voir ma boutique',
  );
  await sendEmail({ to: found.owner.email, subject: `FootHub · ${title}`, ...content });
}

export async function sendPasswordResetOtp(email: string, name: string, otp: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email] SMTP non configuré, code OTP pour ${email} : ${otp}`);
    return;
  }

  const title = 'Réinitialisation de votre mot de passe';
  const content = layout(
    title,
    [
      `Bonjour ${name},`,
      `Voici votre code de vérification (OTP) : ${otp}`,
      'Ce code est valable pendant 10 minutes.',
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
    ],
    '/forgot-password',
    'Réinitialiser mon mot de passe',
  );
  await sendEmail({ to: email, subject: `FootHub · ${title}`, ...content });
}
