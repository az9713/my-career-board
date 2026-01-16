'use client'

import { ReactNode } from 'react'

interface TouchableCardProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function TouchableCard({
  children,
  onClick,
  disabled = false,
  className = '',
}: TouchableCardProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <div
      data-testid="touchable-card"
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      className={`
        bg-slate-800 rounded-lg border border-slate-700 p-4
        transition-all duration-150
        ${onClick && !disabled ? 'cursor-pointer active:scale-98 hover:border-slate-600' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      {children}
    </div>
  )
}
