'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'

export default function Avatar({
  uid,
  url,
  size,
  onUpload,
}: {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function downloadImage(uid: string) {
      try {
        const { data, error } = await supabase.storage.from('md-blog').download(`avatars/${uid}.png`)
        if (error) throw error

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.error('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください。')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${uid}.${fileExt}`

      const {error: deleteError} = await supabase.storage.from('md-blog').remove([filePath]);
      const { data: data, error: uploadError } = await supabase.storage.from('md-blog').upload(filePath, file)
      if (uploadError) throw uploadError

      const publicUrl = supabase.storage
      .from("md-blog")
      .getPublicUrl(data.path).data.publicUrl;

      const {error: updateError} = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', uid)
      if (updateError) throw updateError

      onUpload(filePath)
    } catch (error) {
      alert('アバターのアップロード中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {avatarUrl ? (
        <Image
          width={size}
          height={size}
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full object-cover border-2 border-gray-300"
          style={{ height: size, width: size }}
        />
      ) : (
        <div
          className="rounded-full bg-gray-200 border-2 border-gray-300"
          style={{ height: size, width: size }}
        />
      )}

      <div>
        <label
          htmlFor="single"
          className="cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition"
        >
          {uploading ? 'Uploading...' : 'Change avater'}
        </label>
        <input
          id="single"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  )
}
