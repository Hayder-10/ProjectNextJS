import { requireUser } from '@/lib/auth';
import { getMyTeam } from '@/lib/queries/myxi';
import Card from '@/components/ui/Card';
import PostForm from '@/components/forum/PostForm';

export const metadata = { title: 'Nouvelle publication' };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const user = await requireUser();
  const { team: teamId } = await searchParams;
  // ?team= : publication d'une formation depuis Mon XI
  const found = teamId ? await getMyTeam(teamId) : null;
  const team = found?.owner === user.id ? found : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">{team ? 'Publier ma formation' : 'Nouvelle publication'}</h1>
      <Card>
        <PostForm team={team ?? undefined} />
      </Card>
    </div>
  );
}
