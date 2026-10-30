import { withAuth } from 'next-auth/middleware';

// Routes privées : un visiteur est redirigé vers /login.
// Les pages admin appellent aussi requireAdmin() côté serveur.
export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/profile',
    '/my-xi/:path*',
    '/shop/cart',
    '/shop/orders',
    '/bookings',
    '/forum/new',
    '/tournaments/new',
    '/admin/:path*',
  ],
};
