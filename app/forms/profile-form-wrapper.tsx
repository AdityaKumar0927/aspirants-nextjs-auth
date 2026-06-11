"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ProfileForm from "./profile-form";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: string;
  username: string;
  email: string;
  bio: string;
  urls: { value: string }[];
  name: string;
  language: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  cookiePolicyAccepted: boolean;
}

export default function ProfileFormWrapper() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/settings/profile-settings/${session.user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const data: UserData = await response.json();
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!userData) {
    return <div>Error: Unable to load user data</div>;
  }

  const initialData: UserData = {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    bio: userData.bio,
    urls: userData.urls || [],
    name: userData.name,
    language: userData.language,
    termsAccepted: userData.termsAccepted || false,
    privacyPolicyAccepted: userData.privacyPolicyAccepted || false,
    cookiePolicyAccepted: userData.cookiePolicyAccepted || false,
  };

  return (
    <ProfileForm
      initialData={initialData}
      userRole={session?.user?.role || 'member'}
      userId={session?.user?.id || ''}
    />
  );
}