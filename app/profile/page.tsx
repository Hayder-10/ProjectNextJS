import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getUserById } from '@/lib/queries/users';
import { getClubById, getClubsGroupedByCompetition } from '@/lib/queries/football';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProfileForm from '@/components/users/ProfileForm';
import PasswordForm from '@/components/users/PasswordForm';
import DeleteAccountButton from '@/components/users/DeleteAccountButton';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Profil' };

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await getUserById(sessionUser.id);
  if (!user) notFound();

  const [clubGroups, favoriteClub] = await Promise.all([
    getClubsGroupedByCompetition(),
    user.favoriteClub ? getClubById(user.favoriteClub) : null,
  ]);

  const links = [
    { href: `/forum?author=${user._id}`, label: 'Mes publications', icon: 'chat' as const },
    { href: '/my-xi', label: 'Mes XI', icon: 'shirt' as const },
    { href: '/shop/orders', label: 'Mes commandes', icon: 'package' as const },
    { href: '/bookings', label: 'Mes réservations', icon: 'goal' as const },
    { href: '/tournaments?tab=mine', label: 'Mes tournois', icon: 'trophy' as const },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-emerald-700 text-2xl font-bold text-white ring-4 ring-green-500/20">
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="page-title text-2xl sm:text-3xl">{user.name}</h1>
          <p className="text-sm text-slate-400">{user.email}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {user.role === 'admin' && <Badge color="amber">Admin</Badge>}
            {user.city && <Badge><Icon name="pin" className="h-3 w-3" /> {user.city}</Badge>}
            {favoriteClub && (
              <Link href={`/football/clubs/${favoriteClub.tmId}`}>
                <Badge color="green"><Icon name="heart" filled className="h-3 w-3" /> {favoriteClub.name}</Badge>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card card-hover flex items-center gap-3 text-sm font-semibold">
            <Icon name={l.icon} className="h-5 w-5 text-green-400" />
            {l.label}
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="section-title mb-4">Modifier mon profil</h2>
        <ProfileForm user={user} clubGroups={clubGroups} />
      </Card>

      <Card>
        <h2 className="section-title mb-4">Changer mon mot de passe</h2>
        <PasswordForm />
      </Card>

      <Card>
        <h2 className="section-title mb-2 text-red-400">Zone de danger</h2>
        <p className="mb-4 text-sm text-slate-400">La suppression de votre compte est définitive.</p>
        <DeleteAccountButton />
      </Card>
    </div>
  );
}
