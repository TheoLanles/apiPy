'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Essayer de charger les données de l'utilisateur s'il est connecté
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (error: any) {
          // L'utilisateur n'a pas de token valide ou n'est pas connecté
          // C'est normal, on continue sans utilisateur
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Charger une seule fois au démarrage
    if (!initialized) {
      initializeAuth();
    }
  }, [initialized, setUser, setLoading]);

  return <>{children}</>;
}
