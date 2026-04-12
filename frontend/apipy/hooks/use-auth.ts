import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Hook pour protéger une route et rediriger si non authentifié
 * Utilisation: const { isLoading } = useRequireAuth();
 */
export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return { isLoading, isAuthenticated: !!user };
}

/**
 * Hook pour rediriger si déjà authentifié
 * Utile pour les pages de login/setup
 * Utilisation: const { isLoading } = useRedirectIfAuthenticated();
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  return { isLoading, isAuthenticated: !!user };
}
