import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false); // NOVO: Estado global de bloqueio

  useEffect(() => {
    let subscription: any;

    // NOVO: Função para buscar o status de bloqueio no banco
    const fetchBlockStatus = async (userId: string) => {
      try {
        const { data } = await supabase.from('profiles').select('is_blocked').eq('id', userId).maybeSingle();
        setIsBlocked(!!data?.is_blocked);
      } catch (e) {
        console.error("Erro ao checar bloqueio:", e);
      }
    };

    const initializeAuth = async () => {
      const isTemp = localStorage.getItem('temp_session_flag') === 'true';
      const hasCookie = document.cookie.includes('session_active=true');

      if (isTemp && !hasCookie) {
        await supabase.auth.signOut();
        localStorage.removeItem('temp_session_flag');
      }

      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) fetchBlockStatus(session.user.id); // Busca o status ao mudar a sessão
          else setIsBlocked(false);
          setLoading(false);
        }
      );
      subscription = data.subscription;

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchBlockStatus(session.user.id); // Busca o status ao carregar a página
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
      email, password, options: { emailRedirectTo: redirectUrl, data: metadata }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
    isBlocked, // NOVO: Exportamos a variável para usar nas páginas
    signUp,
    signIn,
    signOut
  };
};