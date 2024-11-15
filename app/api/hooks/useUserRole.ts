import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useUserRole() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return; // Wait for the session to load
    }

    if (!session) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user/role', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }

        const data = await response.json();
        setUserRole(data.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, status]);

  return { userRole, loading, error };
}