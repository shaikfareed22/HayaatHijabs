import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { siteUrl } from '@/lib/siteUrls';
import { AdminLoading, NoAdminAccess } from './AdminGuard';
import { useIsAdmin } from './useIsAdmin';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const { toast } = useToast();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (loading) return <AdminLoading />;
  if (user) {
    if (isAdmin === null) return <AdminLoading />;
    return isAdmin ? <Navigate to={from} replace /> : <NoAdminAccess />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      // Once signed in, the checks above redirect admins and turn others away.
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: 'Sign In Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: siteUrl(from) },
    });
    if (error) {
      toast({ title: 'Google Sign In Failed', description: error.message, variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-lg gradient-luxury flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-luxury">Hayaat Admin</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your admin account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/reset-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" disabled={isLoading} onClick={handleGoogleSignIn}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
