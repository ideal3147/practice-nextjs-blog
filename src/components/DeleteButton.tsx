'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string;
}

export default function DeleteButton({ slug }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await createClient().auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

  if (!user) return null

  const handleClick = async () => {
    try {
      setIsDeleting(true)
      if (!window.confirm("本当に削除してよろしいですか？")) return;
      const response = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (response.ok) {
        alert("記事が削除されました。");
        router.push("/")
      } else {
        alert("記事の削除に失敗しました。");
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-60"
    >
      {isDeleting ? '削除中...' : '削除'}
    </button>
  )
}
