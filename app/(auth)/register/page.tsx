import Link from 'next/link';
import Card from '@/components/ui/Card';
import RegisterForm from '@/components/users/RegisterForm';

export const metadata = { title: 'Inscription' };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="page-title">Créer un compte</h1>
      <Card>
        <RegisterForm />
      </Card>
      <p className="text-center text-sm text-slate-400">
        Déjà inscrit ?{' '}
        <Link href="/login" className="link">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
