import type { Metadata, Viewport } from 'next';
import { Inter, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import RegisterSW from '@/components/layout/RegisterSW';
import OfflineBanner from '@/components/layout/OfflineBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-barlow' });

export const metadata: Metadata = {
  title: { default: 'FootHub', template: '%s · FootHub' },
  description: 'Communauté football, boutique, réservation de terrains et tournois',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${barlow.variable}`}>
      <body className="min-h-screen font-sans text-slate-100 antialiased selection:bg-green-500/30">
        <Providers>
          <Header />
          <OfflineBanner />
          <main className="animate-fade-up mx-auto max-w-5xl px-4 pb-24 pt-20 md:pb-12 md:pt-24">{children}</main>
          <BottomNav />
          <RegisterSW />
        </Providers>
      </body>
    </html>
  );
}
