import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock hooks
jest.mock('@/hooks/useMobileDetect', () => ({
  useMobileDetect: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    deviceType: 'mobile',
  })),
}))

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(() => true),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

import { MobileNav } from '@/components/mobile/MobileNav'
import { BottomNav } from '@/components/mobile/BottomNav'
import { MobileMenu } from '@/components/mobile/MobileMenu'
import { ResponsiveContainer } from '@/components/mobile/ResponsiveContainer'
import { TouchableCard } from '@/components/mobile/TouchableCard'
import { InstallPromptBanner } from '@/components/mobile/InstallPromptBanner'

describe('MobileNav Component', () => {
  it('should render hamburger menu button', () => {
    render(<MobileNav />)

    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('should toggle menu on button click', async () => {
    render(<MobileNav />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  it('should display logo', () => {
    render(<MobileNav />)

    expect(screen.getByText(/career board/i)).toBeInTheDocument()
  })

  it('should close menu when clicking outside', async () => {
    render(<MobileNav />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    // Click overlay to close
    const overlay = screen.getByTestId('menu-overlay')
    fireEvent.click(overlay)

    await waitFor(() => {
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })
})

describe('BottomNav Component', () => {
  it('should render navigation items', () => {
    render(<BottomNav />)

    expect(screen.getByRole('link', { name: /^dashboard$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^board$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^history$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^settings$/i })).toBeInTheDocument()
  })

  it('should highlight active route', () => {
    render(<BottomNav />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('active')
  })

  it('should be fixed at bottom', () => {
    render(<BottomNav />)

    const nav = screen.getByTestId('bottom-nav')
    expect(nav).toHaveClass('fixed')
    expect(nav).toHaveClass('bottom-0')
  })
})

describe('MobileMenu Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render menu items', () => {
    render(<MobileMenu isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/board room/i)).toBeInTheDocument()
    expect(screen.getByText(/portfolio/i)).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', () => {
    render(<MobileMenu isOpen={true} onClose={mockOnClose} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(<MobileMenu isOpen={false} onClose={mockOnClose} />)

    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()
  })

  it('should animate slide in', () => {
    render(<MobileMenu isOpen={true} onClose={mockOnClose} />)

    const menu = screen.getByTestId('mobile-menu')
    expect(menu).toHaveClass('translate-x-0')
  })
})

describe('ResponsiveContainer Component', () => {
  it('should apply mobile styles on mobile', () => {
    render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    )

    const container = screen.getByTestId('responsive-container')
    expect(container).toHaveClass('px-4')
  })

  it('should render children', () => {
    render(
      <ResponsiveContainer>
        <div>Test Content</div>
      </ResponsiveContainer>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should support custom className', () => {
    render(
      <ResponsiveContainer className="custom-class">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const container = screen.getByTestId('responsive-container')
    expect(container).toHaveClass('custom-class')
  })
})

describe('TouchableCard Component', () => {
  it('should render card content', () => {
    render(
      <TouchableCard>
        <p>Card Content</p>
      </TouchableCard>
    )

    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const onClick = jest.fn()

    render(
      <TouchableCard onClick={onClick}>
        <p>Clickable Card</p>
      </TouchableCard>
    )

    fireEvent.click(screen.getByText('Clickable Card'))

    expect(onClick).toHaveBeenCalled()
  })

  it('should have touch feedback styles', () => {
    render(
      <TouchableCard onClick={() => {}}>
        <p>Card</p>
      </TouchableCard>
    )

    const card = screen.getByTestId('touchable-card')
    expect(card).toHaveClass('active:scale-98')
  })

  it('should support disabled state', () => {
    const onClick = jest.fn()

    render(
      <TouchableCard onClick={onClick} disabled>
        <p>Disabled Card</p>
      </TouchableCard>
    )

    fireEvent.click(screen.getByText('Disabled Card'))

    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('InstallPromptBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render install prompt when available', () => {
    render(<InstallPromptBanner canInstall={true} onInstall={jest.fn()} />)

    expect(screen.getByText(/install app/i)).toBeInTheDocument()
  })

  it('should not render when install not available', () => {
    render(<InstallPromptBanner canInstall={false} onInstall={jest.fn()} />)

    expect(screen.queryByText(/install app/i)).not.toBeInTheDocument()
  })

  it('should call onInstall when button clicked', () => {
    const onInstall = jest.fn()

    render(<InstallPromptBanner canInstall={true} onInstall={onInstall} />)

    fireEvent.click(screen.getByRole('button', { name: /install/i }))

    expect(onInstall).toHaveBeenCalled()
  })

  it('should allow dismissing the banner', () => {
    const onDismiss = jest.fn()

    render(
      <InstallPromptBanner
        canInstall={true}
        onInstall={jest.fn()}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('should show app benefits', () => {
    render(<InstallPromptBanner canInstall={true} onInstall={jest.fn()} />)

    expect(screen.getByText(/faster access/i)).toBeInTheDocument()
  })
})
