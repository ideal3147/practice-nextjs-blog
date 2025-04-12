'use client';

import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInOrOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    // router.refresh(); // or router.push("/signin") if you have a login page
  };

  const handleSignIn = async () => {
    router.push("/login");
  };
  const isLoggedIn = !!user

  return (
    <button
      onClick={isLoggedIn ? handleSignOut : handleSignIn}
      className={`absolute top-6 right-6 text-sm px-4 py-2 rounded-lg shadow transition-colors
        ${isLoggedIn 
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      title={isLoggedIn ? 'Sign Out' : 'Sign In'}
    >
      {isLoggedIn ? 'Sign Out' : 'Sign In'}
    </button>
  );
}
