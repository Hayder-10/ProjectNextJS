import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getPost } from '@/lib/queries/forum';
import Card from '@/components/ui/Card';
import PostForm from '@/components/forum/PostForm';

export const metadata = { title: 'Modifier la publication' };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const post = await getPost(id);
  if (!post) notFound();
  if (post.author?._id !== user.id && user.role !== 'admin') notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier la publication</h1>
      <Card>
        <PostForm id={post._id} post={post} />
      </Card>
    </div>
  );
}
