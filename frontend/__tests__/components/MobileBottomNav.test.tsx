import { render, screen } from '@testing-library/react'
import MobileBottomNav from '@/components/MobileBottomNav'

// Mock the hooks
const mockUseAuth = jest.fn()
const mockUseLanguage = jest.fn()
const mockUseUnreadCount = jest.fn()
const mockUsePathname = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
}))

jest.mock('@/hooks/useMessages', () => ({
  useUnreadCount: () => mockUseUnreadCount(),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('MobileBottomNav Component', () => {
  beforeEach(() => {
    // Default mocks
    mockUseLanguage.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.dashboard': 'داشبورد',
          'nav.cards': 'کارت‌ها',
          'nav.communities': 'کامیونیتی‌ها',
          'nav.messages': 'پیام‌ها',
        }
        return translations[key] || key
      },
    })
    mockUseUnreadCount.mockReturnValue({ data: 0 })
    mockUsePathname.mockReturnValue('/dashboard')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    const { container } = render(<MobileBottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing on auth pages', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUsePathname.mockReturnValue('/auth/login')

    const { container } = render(<MobileBottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('renders navigation when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })

    render(<MobileBottomNav />)
    
    expect(screen.getByText('داشبورد')).toBeInTheDocument()
    expect(screen.getByText('کارت‌ها')).toBeInTheDocument()
    expect(screen.getByText('کامیونیتی‌ها')).toBeInTheDocument()
    expect(screen.getByText('پیام‌ها')).toBeInTheDocument()
  })

  it('renders on landing page when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUsePathname.mockReturnValue('/')

    render(<MobileBottomNav />)
    
    expect(screen.getByText('داشبورد')).toBeInTheDocument()
  })

  it('shows unread badge when there are unread messages', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUseUnreadCount.mockReturnValue({ data: 5 })

    render(<MobileBottomNav />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ when unread count exceeds 99', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUseUnreadCount.mockReturnValue({ data: 150 })

    render(<MobileBottomNav />)
    
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('does not show badge when unread count is 0', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUseUnreadCount.mockReturnValue({ data: 0 })

    render(<MobileBottomNav />)
    
    // Badge should not exist
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })

    render(<MobileBottomNav />)
    
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
    
    expect(links[0]).toHaveAttribute('href', '/dashboard')
    expect(links[1]).toHaveAttribute('href', '/cards')
    expect(links[2]).toHaveAttribute('href', '/communities')
    expect(links[3]).toHaveAttribute('href', '/messages')
  })

  it('highlights active item based on pathname', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Test' },
      isAuthenticated: true,
    })
    mockUsePathname.mockReturnValue('/cards')

    render(<MobileBottomNav />)
    
    const cardsLink = screen.getByText('کارت‌ها').closest('a')
    expect(cardsLink).toHaveClass('text-primary-600')
  })
})

