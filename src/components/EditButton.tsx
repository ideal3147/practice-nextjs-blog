'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export default function EditButton({
  onClick,
}: {
  onClick: () => void
}) {
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
    <button
      onClick={onClick}
      className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
    >
      編集
    </button>
  )
}
