'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    // router.refresh(); // or router.push("/signin") if you have a login page
  };

  return (
    <button
      onClick={handleSignOut}
      className="absolute top-6 right-6 text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow"
    >
      Sign Out
    </button>
  );
}
