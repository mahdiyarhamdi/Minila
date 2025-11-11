import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCards, useCard, useCreateCard } from '@/hooks/useCards'
import { apiService } from '@/lib/api'

jest.mock('@/lib/api')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useCards Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches cards list', async () => {
    const mockData = {
      items: [{ id: 1, origin: 'Tehran', destination: 'Mashhad' }],
      total: 1,
      page: 1,
      page_size: 20,
    }
    ;(apiService.getCards as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useCards(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })

  it('fetches single card', async () => {
    const mockCard = { id: 1, origin: 'Tehran', destination: 'Mashhad' }
    ;(apiService.getCardById as jest.Mock).mockResolvedValue(mockCard)

    const { result } = renderHook(() => useCard(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCard)
  })

  it('creates new card', async () => {
    const mockCard = { id: 1, origin: 'Tehran', destination: 'Mashhad' }
    ;(apiService.createCard as jest.Mock).mockResolvedValue(mockCard)

    const { result } = renderHook(() => useCreateCard(), { wrapper: createWrapper() })

    await result.current.mutateAsync({
      origin: 'Tehran',
      destination: 'Mashhad',
      category: 'سایر',
      packaging_status: 'بدون بسته‌بندی',
    })

    expect(apiService.createCard).toHaveBeenCalled()
  })
})

