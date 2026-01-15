'use client'

import { useState, useEffect } from 'react'
import { useMediaQuery } from './useMediaQuery'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface MobileDetectResult {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
  isIOS: boolean
  isAndroid: boolean
  isTouchDevice: boolean
}

/**
 * Hook to detect mobile devices and their capabilities
 */
export function useMobileDetect(): MobileDetectResult {
  const [result, setResult] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false,
  })

  const isMobileScreen = useMediaQuery('(max-width: 767px)')
  const isTabletScreen = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent.toLowerCase()

    // Check for mobile user agents
    const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i
    const tabletRegex = /ipad|android(?!.*mobile)|tablet/i
    const iosRegex = /iphone|ipad|ipod/i
    const androidRegex = /android/i

    const isMobileUA = mobileRegex.test(userAgent)
    const isTabletUA = tabletRegex.test(userAgent)
    const isIOS = iosRegex.test(userAgent)
    const isAndroid = androidRegex.test(userAgent)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Combine UA detection with screen size
    const isMobile = isMobileUA || isMobileScreen
    const isTablet = isTabletUA || isTabletScreen
    const isDesktop = !isMobile && !isTablet

    let deviceType: DeviceType = 'desktop'
    if (isMobile) deviceType = 'mobile'
    else if (isTablet) deviceType = 'tablet'

    setResult({
      isMobile,
      isTablet,
      isDesktop,
      deviceType,
      isIOS,
      isAndroid,
      isTouchDevice,
    })
  }, [isMobileScreen, isTabletScreen])

  return result
}
