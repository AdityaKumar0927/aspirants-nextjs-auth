"use client"
// src/components/ClientSessionProvider.tsx

import React from 'react';
import { SessionProvider } from 'next-auth/react';

const ClientSessionProvider = ({ children, session }: { children: React.ReactNode, session: any }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default ClientSessionProvider;
