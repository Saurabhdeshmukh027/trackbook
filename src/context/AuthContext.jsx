import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/config';
import { getBusinessByUserId, createBusiness, checkIsAdmin } from '../supabase/db';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const processingRef = useRef(false);
  const nextSessionRef = useRef(null);
  const hasNextSessionRef = useRef(false);
  const userRef = useRef(null);

  useEffect(() => {
    // Explicitly check initial session (doesn't rely on event firing)
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Safety timeout — never hang on loading screen for more than 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSession = async (session) => {
    if (processingRef.current) {
      nextSessionRef.current = session;
      hasNextSessionRef.current = true;
      return;
    }
    processingRef.current = true;

    try {
      let currentSession = session;
      while (true) {
        if (currentSession?.user) {
          setUser(currentSession.user);
          userRef.current = currentSession.user;

          // Run admin check and business fetch in parallel for faster init
          const [adminStatus, biz] = await Promise.all([
            checkIsAdmin(currentSession.user.id),
            getBusinessByUserId(currentSession.user.id).catch((error) => {
              console.error('Failed to fetch business data:', error);
              return null;
            }),
          ]);

          setIsAdmin(adminStatus);
          if (!adminStatus) {
            setBusiness(biz);
          }
        } else {
          setUser(null);
          userRef.current = null;
          setBusiness(null);
          setIsAdmin(false);
        }

        if (hasNextSessionRef.current) {
          currentSession = nextSessionRef.current;
          nextSessionRef.current = null;
          hasNextSessionRef.current = false;
        } else {
          break;
        }
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, businessData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { email_confirm: true },
      },
    });
    if (error) throw error;

    if (data.user) {
      await createBusiness(data.user.id, {
        email,
        ...businessData,
      });
      const biz = await getBusinessByUserId(data.user.id);
      setBusiness(biz);
    }
    return data;
  };

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const refreshBusiness = useCallback(async () => {
    const currentUser = userRef.current;
    if (currentUser) {
      try {
        const biz = await getBusinessByUserId(currentUser.id);
        setBusiness(biz);
      } catch (error) {
        console.error('Failed to refresh business data:', error);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, business, isAdmin, loading,
      login, register, logout, resetPassword, refreshBusiness, setBusiness
    }}>
      {children}
    </AuthContext.Provider>
  );
};
