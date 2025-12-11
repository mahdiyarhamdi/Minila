import { render } from '@testing-library/react'
import ContentWrapper from '@/components/ContentWrapper'

// Mock the hooks
const mockUseAuth = jest.fn()
const mockUsePathname = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('ContentWrapper Component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('adds padding when authenticated and not on auth page', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUsePathname.mockReturnValue('/dashboard')

    const { container } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(container.firstChild).toHaveClass('pb-16')
    expect(container.firstChild).toHaveClass('md:pb-0')
  })

  it('does not add padding when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUsePathname.mockReturnValue('/dashboard')

    const { container } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(container.firstChild).not.toHaveClass('pb-16')
  })

  it('does not add padding on auth pages', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUsePathname.mockReturnValue('/auth/login')

    const { container } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(container.firstChild).not.toHaveClass('pb-16')
  })

  it('does not add padding on signup page', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUsePathname.mockReturnValue('/auth/signup')

    const { container } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(container.firstChild).not.toHaveClass('pb-16')
  })

  it('adds padding on landing page when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUsePathname.mockReturnValue('/')

    const { container } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(container.firstChild).toHaveClass('pb-16')
  })

  it('renders children correctly', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUsePathname.mockReturnValue('/dashboard')

    const { getByText } = render(
      <ContentWrapper>
        <div>Test Content</div>
      </ContentWrapper>
    )
    
    expect(getByText('Test Content')).toBeInTheDocument()
  })
})

