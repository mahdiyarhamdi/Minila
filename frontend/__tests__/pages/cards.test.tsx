import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CardsPage from '@/app/cards/page'

jest.mock('@/hooks/useCards', () => ({
  useCards: jest.fn(() => ({
    data: {
      items: [
        {
          id: 1,
          origin: 'Tehran',
          destination: 'Mashhad',
          category: 'الکترونیک',
          packaging_status: 'بسته‌بندی شده',
          owner: { first_name: 'علی', last_name: 'احمدی' },
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    },
    isLoading: false,
    error: null,
  })),
}))

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Cards Page', () => {
  it('renders cards list page', () => {
    render(<CardsPage />, { wrapper: createWrapper() })
    expect(screen.getByText('کارت‌های سفر و بار')).toBeInTheDocument()
  })

  it('shows card items', () => {
    render(<CardsPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Tehran → Mashhad')).toBeInTheDocument()
  })

  it('shows create card button', () => {
    render(<CardsPage />, { wrapper: createWrapper() })
    expect(screen.getByText('ایجاد کارت جدید')).toBeInTheDocument()
  })
})

