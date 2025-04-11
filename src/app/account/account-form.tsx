'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import Avatar from './avatar'
import { redirect } from 'next/navigation'

// ...

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, website, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function skip(): Promise<void> {
    redirect('/');
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string | null
    fullname: string | null
    website: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error;
      alert('Profile updated!');
      window.location.href="/"
    } catch (error) {
      alert('Error updating the data!')
      setLoading(false)
    }
  }

  return (
    <div className="form-widget">

        <Avatar
            uid={user?.id ?? null}
            url={avatar_url}
            size={150}
            onUpload={(url) => {
            setAvatarUrl(url)
            updateProfile({ fullname, username, website, avatar_url: url })
            }}
        />
      {/* ... */}

      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
        />
      </div>
      <div>
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullname || ''}
          onChange={(e) => setFullname(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black"
        />
      </div>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username || ''}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black"
        />
      </div>
      <div>
        <button
          onClick={() => updateProfile({ fullname, username, website, avatar_url })}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow"
        >
          {loading ? 'Loading ...' : 'Update'}
        </button>

        <button
          onClick={() => skip()}
          className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition shadow"
        >
          Skip
        </button>
      </div>
    </div>
  )
}