'use client';

import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AppRole, ApprovalStatus, Profile } from '@/lib/types';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  approvalStatus: ApprovalStatus | null;
  loading: boolean;
  isApproved: boolean;
}

export interface AuthContextValue extends AuthState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  
  const [state, setState] = React.useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    approvalStatus: null,
    loading: true,
    isApproved: false,
  });

  const loadProfile = React.useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Failed to load profile:', error.message);
        return null;
      }
      return data as Profile;
    },
    []
  );

  const refreshProfile = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState({
        user: null,
        session: null,
        profile: null,
        role: null,
        approvalStatus: null,
        loading: false,
        isApproved: false,
      });
      return;
    }
    const profile = await loadProfile(user.id);
    setState({
      user,
      session: null,
      profile,
      role: profile?.role ?? null,
      approvalStatus: profile?.approval_status ?? null,
      loading: false,
      isApproved: profile?.approval_status === 'approved',
    });
  }, [loadProfile]);

  const signOut = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setState({
        user: null,
        session: null,
        profile: null,
        role: null,
        approvalStatus: null,
        loading: false,
        isApproved: false,
      });
      window.location.href = '/login';
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        setState({
          user: null,
          session: null,
          profile: null,
          role: null,
          approvalStatus: null,
          loading: false,
          isApproved: false,
        });
        return;
      }

      const profile = await loadProfile(session.user.id);
      if (!mounted) return;
      setState({
        user: session.user,
        session,
        profile,
        role: profile?.role ?? null,
        approvalStatus: profile?.approval_status ?? null,
        loading: false,
        isApproved: profile?.approval_status === 'approved',
      });
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (!mounted) return;
        if (!session) {
          setState({
            user: null,
            session: null,
            profile: null,
            role: null,
            approvalStatus: null,
            loading: false,
            isApproved: false,
          });
          return;
        }
        const profile = await loadProfile(session.user.id);
        if (!mounted) return;
        setState({
          user: session.user,
          session,
          profile,
          role: profile?.role ?? null,
          approvalStatus: profile?.approval_status ?? null,
          loading: false,
          isApproved: profile?.approval_status === 'approved',
        });
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
