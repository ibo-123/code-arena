import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'blue' | 'gold' | 'green' | 'red' | 'muted' | 'purple';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  tone = 'blue', 
  className = '',
  style 
}) => {
  const toneStyles = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    muted: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneStyles[tone]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export default Badge;
