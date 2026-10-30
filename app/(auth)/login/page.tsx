import Link from 'next/link';
import Card from '@/components/ui/Card';
import LoginForm from '@/components/users/LoginForm';

export const metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; registered?: string }> }) {
  const { callbackUrl, registered } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="page-title">Connexion</h1>
      {registered && <p className="rounded-xl bg-green-500/10 p-3 text-sm text-green-400">Compte créé ! Vous pouvez vous connecter.</p>}
      <Card>
        <LoginForm callbackUrl={callbackUrl ?? '/'} />
      </Card>
      <p className="text-center text-sm text-slate-400">
        Pas encore de compte ?{' '}
        <Link href="/register" className="link">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
