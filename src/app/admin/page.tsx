import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { fetchAdminUsersAction } from './actions';

export default async function AdminPage() {
  const supabase = createClient();

  // 1. Check authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Check admin role from the database
  const { data: roleRecord, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // 3. Deny access if role is missing, incorrect, or query fails
  if (error || roleRecord?.role !== 'admin') {
    redirect('/');
  }

  // 4. Fetch real registered users from Supabase Auth (server-side)
  const usersResult = await fetchAdminUsersAction();

  return (
    <AdminDashboardClient
      adminEmail={user.email || 'Administrator'}
      userRecords={usersResult.users}
      hasServiceKey={usersResult.hasServiceKey}
    />
  );
}