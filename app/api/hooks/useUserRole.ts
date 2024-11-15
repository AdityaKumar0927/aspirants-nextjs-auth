import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useUserRole() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/user/role', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user role');
          }

          const data = await response.json();
          setUserRole(data.role);
        } catch (err) {
          setError('Error fetching user role');
          console.error('Error fetching user role:', err);
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setUserRole(null);
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [status]);

  return { userRole, loading, error };
}