import { requireUser } from '@/lib/auth';
import Card from '@/components/ui/Card';
import PostForm from '@/components/forum/PostForm';

export const metadata = { title: 'Nouvelle publication' };

export default async function NewPostPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Nouvelle publication</h1>
      <Card>
        <PostForm />
      </Card>
    </div>
  );
}
