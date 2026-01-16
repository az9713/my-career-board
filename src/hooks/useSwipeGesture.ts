'use client'

import { useEffect, useRef, RefObject } from 'react'

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
}

interface TouchPosition {
  x: number
  y: number
}

/**
 * Hook to detect swipe gestures on an element
 */
export function useSwipeGesture(
  ref: RefObject<HTMLElement>,
  handlers: SwipeHandlers
): void {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
  } = handlers

  const touchStart = useRef<TouchPosition | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Determine if this was a horizontal or vertical swipe
      if (absX > absY && absX >= minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      } else if (absY > absX && absY >= minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }

      touchStart.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance])
}
