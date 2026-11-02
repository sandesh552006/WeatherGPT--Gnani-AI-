import { SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin';

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  created_at?: string;
}

/**
 * Safely fetches the verified user role from public.user_roles.
 * Strict Security Directive:
 * - ADMIN access requires an explicit, verified record where role === 'admin'.
 * - Unknown, missing, or errored roles strictly default to 'user' and will NEVER grant admin privileges.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  if (!userId) return 'user';

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Unable to query user_roles table:', error.message);
      return 'user';
    }

    if (data?.role === 'admin') {
      return 'admin';
    }

    return 'user';
  } catch (err) {
    console.error('Unexpected error checking user role:', err);
    return 'user';
  }
}

/**
 * Checks if user is explicitly verified as an admin.
 */
export async function isVerifiedAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return role === 'admin';
}
