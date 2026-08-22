import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      border border-[#25273D] bg-[#0F101A] rounded-lg p-5
      ${hover ? 'hover:border-[#2979FF] transition-colors duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
