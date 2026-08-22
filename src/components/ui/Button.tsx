import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors duration-200'

  const variants = {
    primary: 'bg-[#2979FF] text-white hover:bg-[#1a6ae0] border border-[#2979FF]',
    secondary: 'bg-transparent text-[#9EAFCE] hover:text-white border border-[#25273D] hover:border-[#2979FF]',
    danger: 'bg-[#FF1744] text-white hover:bg-[#e0133a] border border-[#FF1744]',
    success: 'bg-[#00E676] text-[#06060A] hover:bg-[#00d468] border border-[#00E676]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}
