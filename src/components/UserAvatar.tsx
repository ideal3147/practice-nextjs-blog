'use client'

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Avatar from "@/app/account/avatar";
import Link from "next/link";

export default function UserAvatar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  if (!user) return null;

  return (
    <Link href="/account">
      <div className="absolute top-6 right-30 w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 cursor-pointer">
        <Avatar
          uid={user.id}
          url={user.id}
          size={40}
          onUpload={() => {}}
        />
      </div>
    </Link>
  );
}
