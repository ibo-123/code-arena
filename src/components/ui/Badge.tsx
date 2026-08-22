import React from 'react'

interface BadgeProps {
  tone?: 'blue' | 'green' | 'red' | 'gold' | 'muted' | 'purple'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'blue', children, className = '' }) => {
  const tones = {
    blue: 'text-[#91bbff] border-[#2979ff55] bg-[#2979ff18]',
    green: 'text-[#00E676] border-[#00e67655] bg-[#00e67610]',
    red: 'text-[#ff93a6] border-[#ff174455] bg-[#ff174410]',
    gold: 'text-[#FFD700] border-[#ffd70055] bg-[#ffd70010]',
    muted: 'text-[#61718F] border-[#61718f55] bg-[#61718f10]',
    purple: 'text-[#A855F7] border-[#a855f755] bg-[#a855f710]',
  }

  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold font-mono
      border ${tones[tone]} ${className}
    `}>
      {children}
    </span>
  )
}
