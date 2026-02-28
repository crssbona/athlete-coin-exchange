import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    const initializeAuth = async () => {
      // 1. Verifica se é uma sessão temporária (Manter conectado = false)
      const isTemp = localStorage.getItem('temp_session_flag') === 'true';
      const hasCookie = document.cookie.includes('session_active=true');

      if (isTemp && !hasCookie) {
        // Se era temporária e o cookie de sessão sumiu (usuário fechou o navegador), fazemos logout.
        await supabase.auth.signOut();
        localStorage.removeItem('temp_session_flag');
      }

      // 2. Registra o listener para mudanças de estado da conta
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
      subscription = data.subscription;

      // 3. Puxa a sessão atual (já ajustada pela verificação do passo 1)
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata: any) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };
};
