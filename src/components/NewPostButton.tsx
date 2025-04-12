'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function NewPostButton() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await createClient().auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [])

  if (!user) return null

  return (
    <Link
      href="/new-post"
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      title="新規記事を作成"
    >
      <Plus className="w-6 h-6" />
    </Link>
  )
}
