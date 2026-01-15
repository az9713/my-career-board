'use client'

import { useState } from 'react'
import { MobileMenu } from './MobileMenu'

export function MobileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <span className="text-white font-semibold">Career Board</span>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          data-testid="menu-overlay"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
