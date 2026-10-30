import { requireAdmin } from '@/lib/auth';
import { listUsers } from '@/lib/queries/users';
import { formatDate } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Admin · Utilisateurs' };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const users = await listUsers(q);

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/users" />
      <h1 className="page-title">Utilisateurs ({users.length})</h1>

      <form className="flex gap-2">
        <div className="flex-1">
          <Input name="q" defaultValue={q} placeholder="Rechercher par nom ou e-mail" />
        </div>
        <button className="btn btn-primary">Rechercher</button>
      </form>

      {users.length === 0 ? (
        <EmptyState message="Aucun utilisateur trouvé." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="p-3">Nom</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Inscrit le</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-white/10">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <Badge color={u.role === 'admin' ? 'amber' : 'slate'}>{u.role}</Badge>
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="p-3">
                    {u._id === admin.id ? (
                      <span className="text-slate-400">(vous)</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <ActionButton action="adminSetRole" args={[u._id, u.role === 'admin' ? 'user' : 'admin']}>
                          {u.role === 'admin' ? '→ user' : '→ admin'}
                        </ActionButton>
                        <ConfirmDeleteButton
                          action="adminDeleteUser" args={[u._id]}
                          confirmMessage={`Supprimer le compte de ${u.name} ?`}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
