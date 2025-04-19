'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { type BackButtonProps } from '@/app/lib/types/types'

export default function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <a
      href={href ?? '#'}
      onClick={handleClick}
      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      Back
    </a>
  );
}
