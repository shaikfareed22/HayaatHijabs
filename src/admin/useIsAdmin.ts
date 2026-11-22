import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Asks the database (has_role) whether this user is an admin.
 * Returns null while checking. The database rules are what actually protect admin data;
 * this only decides what the admin site shows.
 */
export function useIsAdmin(user: User | null): boolean | null {
  const [result, setResult] = useState<{ userId: string; isAdmin: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Admin role check failed:', error);
        setResult({ userId: user.id, isAdmin: !error && !!data });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return false;
  return result?.userId === user.id ? result.isAdmin : null;
}
