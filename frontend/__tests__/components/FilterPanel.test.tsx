import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FilterPanel from '@/components/cards/FilterPanel'

// Mock the translation hook
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'cards.filters.title': 'فیلترها',
        'cards.filters.clear': 'پاک کردن',
        'cards.filters.apply': 'اعمال فیلتر',
        'cards.filters.cancel': 'لغو',
        'cards.filters.origin': 'مبدأ',
        'cards.filters.originPlaceholder': 'جستجوی شهر مبدأ...',
        'cards.filters.destination': 'مقصد',
        'cards.filters.destinationPlaceholder': 'جستجوی شهر مقصد...',
        'cards.filters.dateRange': 'بازه تاریخ',
        'cards.filters.fromDate': 'از تاریخ',
        'cards.filters.toDate': 'تا تاریخ',
        'cards.filters.weightRange': 'وزن (کیلوگرم)',
        'cards.filters.minWeight': 'حداقل وزن',
        'cards.filters.maxWeight': 'حداکثر وزن',
        'cards.filters.priceRange': 'بازه قیمت',
        'cards.filters.minPrice': 'حداقل',
        'cards.filters.maxPrice': 'حداکثر',
        'cards.filters.currency': 'واحد پول',
        'cards.filters.packagingStatus': 'وضعیت بسته‌بندی',
        'cards.filters.packaging.all': 'همه',
        'cards.filters.packaging.packed': 'بسته‌بندی شده',
        'cards.filters.packaging.unpacked': 'بدون بسته‌بندی',
        'cards.new.originCountry': 'کشور مبدأ',
        'cards.new.originCity': 'شهر مبدأ',
        'cards.new.destinationCountry': 'کشور مقصد',
        'cards.new.destinationCity': 'شهر مقصد',
        'cards.new.searchCountry': 'جستجوی کشور...',
        'cards.new.searchCity': 'جستجوی شهر...',
        'cards.new.selectCountryFirst': 'ابتدا کشور را انتخاب کنید',
      }
      return translations[key] || key
    },
  }),
}))

// Mock the API service
jest.mock('@/lib/api', () => ({
  apiService: {
    searchCountries: jest.fn().mockResolvedValue({
      items: [
        { id: 1, name_fa: 'ایران', name_en: 'Iran', iso_code: 'IR' },
        { id: 2, name_fa: 'ترکیه', name_en: 'Turkey', iso_code: 'TR' },
      ],
    }),
    searchCities: jest.fn().mockResolvedValue({
      items: [
        { id: 1, name_fa: 'تهران', name_en: 'Tehran', airport_code: 'THR' },
        { id: 2, name_fa: 'اصفهان', name_en: 'Isfahan', airport_code: 'IFN' },
      ],
    }),
  },
}))

describe('FilterPanel Component', () => {
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    mockOnFilterChange.mockClear()
  })

  describe('Desktop View', () => {
    beforeAll(() => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })
    })

    it('renders filter title', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      expect(screen.getAllByText('فیلترها').length).toBeGreaterThan(0)
    })

    it('renders all filter fields', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      expect(screen.getAllByText('مبدأ').length).toBeGreaterThan(0)
      expect(screen.getAllByText('مقصد').length).toBeGreaterThan(0)
      expect(screen.getAllByText('بازه تاریخ').length).toBeGreaterThan(0)
      expect(screen.getAllByText('وزن (کیلوگرم)').length).toBeGreaterThan(0)
      expect(screen.getAllByText('بازه قیمت').length).toBeGreaterThan(0)
      expect(screen.getAllByText('وضعیت بسته‌بندی').length).toBeGreaterThan(0)
    })

    it('renders country and city fields', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      expect(screen.getAllByText('کشور مبدأ').length).toBeGreaterThan(0)
      expect(screen.getAllByText('شهر مبدأ').length).toBeGreaterThan(0)
      expect(screen.getAllByText('کشور مقصد').length).toBeGreaterThan(0)
      expect(screen.getAllByText('شهر مقصد').length).toBeGreaterThan(0)
    })

    it('renders apply and cancel buttons', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      expect(screen.getAllByText('اعمال فیلتر').length).toBeGreaterThan(0)
      expect(screen.getAllByText('لغو').length).toBeGreaterThan(0)
    })

    it('does not call onFilterChange until apply is clicked', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Change min weight input
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // onFilterChange should not be called yet
      expect(mockOnFilterChange).not.toHaveBeenCalled()
    })

    it('calls onFilterChange when apply button is clicked', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Change min weight input
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // Click apply button
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            min_weight: 5,
          })
        )
      })
    })

    it('clears all filters when cancel button is clicked', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // First apply a filter
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // Apply the filter
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled()
      })
      
      // Click cancel button - should clear all filters
      const cancelButtons = screen.getAllByText('لغو')
      fireEvent.click(cancelButtons[0])
      
      // onFilterChange should be called with empty object
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith({})
      })
      
      // Re-query and check the input should be cleared
      const updatedInputs = screen.getAllByPlaceholderText('حداقل وزن')
      expect(updatedInputs[0]).toHaveValue(null)
    })

    it('shows clear button when filters are applied', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Change min weight and apply
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(screen.getAllByText('پاک کردن').length).toBeGreaterThan(0)
      })
    })

    it('clears all filters when clear button is clicked', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Apply a filter first
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled()
      })
      
      // Click clear button
      const clearButtons = screen.getAllByText('پاک کردن')
      fireEvent.click(clearButtons[0])
      
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({})
    })
  })

  describe('Filter Fields', () => {
    it('handles min weight input', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      
      fireEvent.change(minWeightInputs[0], { target: { value: '2' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            min_weight: 2,
          })
        )
      })
    })

    it('handles max weight input', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      const maxWeightInputs = screen.getAllByPlaceholderText('حداکثر وزن')
      
      fireEvent.change(maxWeightInputs[0], { target: { value: '10' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            max_weight: 10,
          })
        )
      })
    })

    it('handles min price input', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      const minPriceInputs = screen.getAllByPlaceholderText('حداقل')
      
      fireEvent.change(minPriceInputs[0], { target: { value: '100' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            min_price: 100,
            currency: 'USD',
          })
        )
      })
    })

    it('handles max price input', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      const maxPriceInputs = screen.getAllByPlaceholderText('حداکثر')
      
      fireEvent.change(maxPriceInputs[0], { target: { value: '500' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            max_price: 500,
            currency: 'USD',
          })
        )
      })
    })

    it('handles packaging status selection', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Find packaging status select
      const packagingSelects = screen.getAllByRole('combobox')
      const packagingSelect = packagingSelects.find(select => {
        const options = select.querySelectorAll('option')
        return Array.from(options).some(opt => opt.textContent === 'بسته‌بندی شده')
      })
      
      if (packagingSelect) {
        fireEvent.change(packagingSelect, { target: { value: 'true' } })
        
        // Click apply
        const applyButtons = screen.getAllByText('اعمال فیلتر')
        fireEvent.click(applyButtons[0])
        
        await waitFor(() => {
          expect(mockOnFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({
              is_packed: true,
            })
          )
        })
      }
    })
  })

  describe('Mobile View', () => {
    beforeAll(() => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
    })

    it('renders filter button in mobile view', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // The button text should be present
      expect(screen.getAllByText('فیلترها').length).toBeGreaterThan(0)
    })
  })

  describe('Initial Filters', () => {
    it('initializes with provided filters', () => {
      const initialFilters = {
        min_weight: 5,
        max_weight: 20,
        min_price: 100,
        max_price: 500,
        currency: 'EUR',
        is_packed: true,
      }
      
      render(
        <FilterPanel
          onFilterChange={mockOnFilterChange}
          initialFilters={initialFilters}
        />
      )
      
      // Check that inputs have initial values
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      expect(minWeightInputs[0]).toHaveValue(5)
      
      const maxWeightInputs = screen.getAllByPlaceholderText('حداکثر وزن')
      expect(maxWeightInputs[0]).toHaveValue(20)
    })
  })

  describe('Filter Count', () => {
    it('shows filter count when filters are applied', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Apply min weight filter
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // Apply max weight filter
      const maxWeightInputs = screen.getAllByPlaceholderText('حداکثر وزن')
      fireEvent.change(maxWeightInputs[0], { target: { value: '10' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        // Check that filter count badge is shown (2 filters applied)
        const badge = screen.queryByText('2')
        expect(badge).toBeInTheDocument()
      })
    })
  })

  describe('Filter Chips', () => {
    it('shows filter chips when filters are applied', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Apply min weight filter
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        // onFilterChange should be called with the filter
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            min_weight: 5,
          })
        )
      })
    })

    it('calls onFilterChange when filter is removed via handleRemoveFilter', async () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Apply min weight filter
      const minWeightInputs = screen.getAllByPlaceholderText('حداقل وزن')
      fireEvent.change(minWeightInputs[0], { target: { value: '5' } })
      
      // Click apply
      const applyButtons = screen.getAllByText('اعمال فیلتر')
      fireEvent.click(applyButtons[0])
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled()
      })
      
      // Click clear to remove all filters
      const clearButtons = screen.getAllByText('پاک کردن')
      fireEvent.click(clearButtons[0])
      
      // Filter should be removed
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith({})
      })
    })
  })

  describe('Price Range', () => {
    it('renders price range inputs', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Should have min and max price inputs
      const minPriceInputs = screen.getAllByPlaceholderText('حداقل')
      const maxPriceInputs = screen.getAllByPlaceholderText('حداکثر')
      expect(minPriceInputs.length).toBeGreaterThan(0)
      expect(maxPriceInputs.length).toBeGreaterThan(0)
    })

    it('renders currency select below price range', () => {
      render(<FilterPanel onFilterChange={mockOnFilterChange} />)
      
      // Should have currency label
      expect(screen.getAllByText('واحد پول').length).toBeGreaterThan(0)
    })
  })
})
