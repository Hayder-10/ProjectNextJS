import Link from 'next/link';
import Card from '@/components/ui/Card';
import ForgotPasswordForm from '@/components/users/ForgotPasswordForm';

export const metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="page-title">Mot de passe oublié</h1>
      <Card>
        <ForgotPasswordForm />
      </Card>
      <p className="text-center text-sm text-slate-400">
        Vous vous souvenez de votre mot de passe ?{' '}
        <Link href="/login" className="link">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
