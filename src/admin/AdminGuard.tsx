import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from './useIsAdmin';

export function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-96" />
      </div>
    </div>
  );
}

export function NoAdminAccess() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
        <h1 className="text-2xl font-luxury">No admin access</h1>
        <p className="text-muted-foreground">
          <strong>{user?.email}</strong> is signed in but is not an admin. Sign in with an admin account.
        </p>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
    </div>
  );
}

/** Only signed-in admins get past this; everyone else goes to the admin login. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const location = useLocation();

  if (loading) return <AdminLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (isAdmin === null) return <AdminLoading />;
  if (!isAdmin) return <NoAdminAccess />;
  return <>{children}</>;
}
