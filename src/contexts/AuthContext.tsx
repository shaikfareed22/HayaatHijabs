import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { siteUrl } from '@/lib/siteUrls';

type UserProfile = Tables<'user_profiles'>;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    redirectPath?: string,
  ) => Promise<{ needsEmailConfirmation: boolean; alreadyRegistered: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileCache = useRef<Record<string, UserProfile>>({});
  const inFlight = useRef<Record<string, Promise<UserProfile | null>>>({});

  const loadProfile = useCallback(async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile missing - create it
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: userEmail || '',
            // Roles are only granted in the database, never from the browser.
            role: 'customer',
          })
          .select('*')
          .single();

        if (newProfile) {
          profileCache.current[userId] = newProfile;
          return newProfile;
        }
        return null;
      }

      if (error) return null;

      if (data) {
        profileCache.current[userId] = data;
        return data;
      }

      return null;
    } catch (err) {
      return null;
    }
  }, []);

  // One request per user at a time; everyone asking at once gets the same answer
  // (previously a second caller got null, which could leave the profile empty).
  const fetchProfile = useCallback((userId: string, userEmail?: string): Promise<UserProfile | null> => {
    if (profileCache.current[userId]) return Promise.resolve(profileCache.current[userId]);
    if (!inFlight.current[userId]) {
      inFlight.current[userId] = loadProfile(userId, userEmail).finally(() => {
        delete inFlight.current[userId];
      });
    }
    return inFlight.current[userId];
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const p = await fetchProfile(session.user.id, session.user.email);
          if (mounted && p) setProfile(p);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          profileCache.current = {};
          if (mounted) setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use cached profile if available
          const cached = profileCache.current[session.user.id];
          if (cached) {
            setProfile(cached);
            if (mounted) setLoading(false);
            return;
          }

          const p = await fetchProfile(session.user.id, session.user.email);
          if (mounted && p) setProfile(p);
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    redirectPath = '/',
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        // The confirmation email brings people back to this site, not to an old domain.
        emailRedirectTo: siteUrl(redirectPath),
      },
    });
    if (error) throw error;
    return {
      // No session yet means Supabase sent a confirmation email first.
      needsEmailConfirmation: !data.session,
      // For an email that is already registered, Supabase returns a user with no identities
      // (instead of an error) so attackers can't probe which emails exist.
      alreadyRegistered: !!data.user && (data.user.identities?.length ?? 0) === 0,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    profileCache.current = {};
    setProfile(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl('/reset-password'),
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signUp, signIn, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
