"use client"

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Navbar from "./navbar";
import { getServerSession, Session } from "next-auth";
import React, { useEffect, useState } from 'react';

const Nav: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function fetchSession() {
      const session = await getServerSession(authOptions);
      setSession(session);
    }
    fetchSession();
  }, []);

  if (session === null) {
    return <div>Loading...</div>;
  }

  return <Navbar session={session} />;
};

export default Nav;
