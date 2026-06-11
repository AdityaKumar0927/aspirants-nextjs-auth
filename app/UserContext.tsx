"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type SessionUser = Session['user'] | null;

interface UserContextProps {
  user: SessionUser;
  setUser: React.Dispatch<React.SetStateAction<SessionUser>>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getSession();
      setUser(session?.user || null);
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
