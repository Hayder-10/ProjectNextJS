import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getLatestPosts } from '@/lib/queries/forum';
import { getOpenTournaments } from '@/lib/queries/tournaments';
import { getLatestProducts } from '@/lib/queries/shop';
import { getUserById } from '@/lib/queries/users';
import { getClubById, getClubLastGames, getCompetitionLastGames, getFootballStats } from '@/lib/queries/football';
import { formatTND } from '@/lib/utils';
import PostCard from '@/components/forum/PostCard';
import TournamentCard from '@/components/tournaments/TournamentCard';
import ProductImage from '@/components/shop/ProductImage';
import GameRow from '@/components/football/GameRow';
import Card from '@/components/ui/Card';

// Données personnalisées (session) : la page est rendue à chaque requête
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = user ? await getUserById(user.id) : null;
  const favoriteClub = profile?.favoriteClub ? await getClubById(profile.favoriteClub) : null;

  const [posts, tournaments, products, games, stats] = await Promise.all([
    getLatestPosts(3),
    getOpenTournaments(3),
    getLatestProducts(3),
    // Derniers matchs du club favori, ou de la Ligue des champions pour un visiteur
    favoriteClub ? getClubLastGames(favoriteClub.tmId, 3) : getCompetitionLastGames('CL', 3),
    getFootballStats(),
  ]);

  const figures = [
    { value: stats.competitions, label: 'Compétitions' },
    { value: stats.clubs, label: 'Clubs' },
    { value: stats.players.toLocaleString('fr-FR'), label: 'Joueurs' },
    { value: stats.games.toLocaleString('fr-FR'), label: 'Matchs' },
  ];

  return (
    <div className="space-y-12">
      {/* Bandeau d'accueil : terrain de nuit, projecteurs et balayage lumineux */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-green-900/70 via-slate-900 to-slate-950 px-6 py-12 shadow-2xl shadow-green-950/50 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-green-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-10 h-60 w-60 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(255,255,255,0.025)_60px,rgba(255,255,255,0.025)_120px)]" />
        <div className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative max-w-2xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
            {user ? `Salut, ${user.name} 👋` : 'La communauté foot tunisienne'}
          </p>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
            Vis le football
            <span className="block bg-linear-to-r from-green-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent">à fond.</span>
          </h1>
          <p className="max-w-lg text-lg text-slate-300">Forum, stats des grands championnats, ton XI de rêve, la boutique, les terrains et les tournois : tout au même endroit.</p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/pitches" className="btn btn-primary">🥅 Réserver un terrain</Link>
                <Link href="/my-xi/new" className="btn btn-secondary">⚽ Composer mon XI</Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn btn-primary">Créer un compte gratuit</Link>
                <Link href="/football" className="btn btn-secondary">Explorer les stats</Link>
              </>
            )}
          </div>
        </div>

        {stats.players > 0 && (
          <div className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {figures.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                <p className="font-display text-3xl font-bold text-white">{f.value}</p>
                <p className="text-xs uppercase tracking-wider text-slate-400">{f.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Section title={favoriteClub ? `Derniers matchs · ${favoriteClub.name}` : 'Derniers matchs · Ligue des champions'} href="/football">
        {games.length === 0 ? <Empty text="Aucun match importé." /> : (
          <Card>
            {games.map((g) => <GameRow key={g.tmId} game={g} />)}
          </Card>
        )}
      </Section>

      <Section title="Dernières publications" href="/forum">
        {posts.length === 0 ? <Empty text="Aucune publication." /> : (
          <div className="grid gap-3 md:grid-cols-3">
            {posts.map((p) => <PostCard key={p._id} post={p} />)}
          </div>
        )}
      </Section>

      <Section title="Tournois ouverts" href="/tournaments">
        {tournaments.length === 0 ? <Empty text="Aucun tournoi ouvert." /> : (
          <div className="grid gap-3 md:grid-cols-3">
            {tournaments.map((t) => <TournamentCard key={t._id} tournament={t} />)}
          </div>
        )}
      </Section>

      <Section title="Nouveautés boutique" href="/shop">
        {products.length === 0 ? <Empty text="Aucun produit." /> : (
          <div className="grid gap-3 sm:grid-cols-3">
            {products.map((p) => (
              <Link key={p._id} href={`/shop/${p._id}`} className="card card-hover group overflow-hidden p-0">
                <div className="overflow-hidden">
                  <ProductImage product={p} className="h-36 transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold text-white">{p.name}</p>
                  <p className="font-display text-xl font-bold text-amber-400">{formatTND(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-2">
        <h2 className="section-title text-2xl">{title}</h2>
        <Link href={href} className="link shrink-0 text-sm">
          Voir tout →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="card text-sm text-slate-400">{text}</p>;
}
