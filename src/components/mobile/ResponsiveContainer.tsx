'use client'

import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div
      data-testid="responsive-container"
      className={`w-full px-4 md:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </div>
  )
}
