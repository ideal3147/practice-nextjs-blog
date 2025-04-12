'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

type DeleteButtonProps = {
  onDelete: () => Promise<void>
}

export default function DeleteButton({ onDelete }: DeleteButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      await onDelete()
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
