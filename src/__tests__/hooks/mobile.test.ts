import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMobileDetect } from '@/hooks/useMobileDetect'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe('useMediaQuery Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true when media query matches', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(true)
  })

  it('should return false when media query does not match', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(false)
  })

  it('should update when media query changes', () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event, cb) => {
          if (event === 'change') listener = cb
        }),
        removeEventListener: jest.fn(),
      })),
    })

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

    expect(result.current).toBe(false)

    // Simulate media query change
    act(() => {
      if (listener) {
        listener({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current).toBe(true)
  })
})

describe('useMobileDetect Hook', () => {
  const originalNavigator = window.navigator

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('should detect mobile user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      writable: true,
    })
    mockMatchMedia(true)

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.isMobile).toBe(true)
  })

  it('should detect desktop user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0' },
      writable: true,
    })
    mockMatchMedia(false)

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.isMobile).toBe(false)
  })

  it('should detect tablet devices', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
      writable: true,
    })
    mockMatchMedia(true)

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.isTablet).toBe(true)
  })

  it('should provide device type', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      writable: true,
    })
    mockMatchMedia(true)

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.deviceType).toBe('mobile')
  })
})

describe('useSwipeGesture Hook', () => {
  it('should detect swipe left', () => {
    const onSwipeLeft = jest.fn()
    const ref = { current: document.createElement('div') }

    const { result } = renderHook(() =>
      useSwipeGesture(ref, { onSwipeLeft })
    )

    // Simulate touch events
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50, clientY: 100 } as Touch],
      })

      ref.current.dispatchEvent(touchStart)
      ref.current.dispatchEvent(touchEnd)
    })

    expect(onSwipeLeft).toHaveBeenCalled()
  })

  it('should detect swipe right', () => {
    const onSwipeRight = jest.fn()
    const ref = { current: document.createElement('div') }

    renderHook(() => useSwipeGesture(ref, { onSwipeRight }))

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 50, clientY: 100 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 } as Touch],
      })

      ref.current.dispatchEvent(touchStart)
      ref.current.dispatchEvent(touchEnd)
    })

    expect(onSwipeRight).toHaveBeenCalled()
  })

  it('should detect swipe up', () => {
    const onSwipeUp = jest.fn()
    const ref = { current: document.createElement('div') }

    renderHook(() => useSwipeGesture(ref, { onSwipeUp }))

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 50 } as Touch],
      })

      ref.current.dispatchEvent(touchStart)
      ref.current.dispatchEvent(touchEnd)
    })

    expect(onSwipeUp).toHaveBeenCalled()
  })

  it('should detect swipe down', () => {
    const onSwipeDown = jest.fn()
    const ref = { current: document.createElement('div') }

    renderHook(() => useSwipeGesture(ref, { onSwipeDown }))

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 50 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 200 } as Touch],
      })

      ref.current.dispatchEvent(touchStart)
      ref.current.dispatchEvent(touchEnd)
    })

    expect(onSwipeDown).toHaveBeenCalled()
  })

  it('should respect minimum swipe distance', () => {
    const onSwipeLeft = jest.fn()
    const ref = { current: document.createElement('div') }

    renderHook(() =>
      useSwipeGesture(ref, { onSwipeLeft, minSwipeDistance: 100 })
    )

    // Small swipe should not trigger
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 80, clientY: 100 } as Touch],
      })

      ref.current.dispatchEvent(touchStart)
      ref.current.dispatchEvent(touchEnd)
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
  })
})

describe('useInstallPrompt Hook', () => {
  beforeEach(() => {
    // Reset matchMedia to return false for standalone mode check
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })
  })

  it('should track install prompt availability', () => {
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.canInstall).toBe(false)
  })

  it('should capture beforeinstallprompt event', () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = jest.fn()
      ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    expect(result.current.canInstall).toBe(true)
  })

  it('should provide install function', async () => {
    const mockPrompt = jest.fn()
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      const event = new Event('beforeinstallprompt')
      ;(event as any).prompt = mockPrompt
      ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
      window.dispatchEvent(event)
    })

    await act(async () => {
      await result.current.promptInstall()
    })

    expect(mockPrompt).toHaveBeenCalled()
  })

  it('should track if app is already installed', () => {
    // Simulate standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })

    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isInstalled).toBe(true)
  })
})
