import { render, screen, fireEvent } from '@testing-library/react'
import DateTimePicker from '@/components/DateTimePicker'

describe('DateTimePicker Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with label', () => {
    render(
      <DateTimePicker
        label="تاریخ سفر"
        onChange={mockOnChange}
      />
    )
    expect(screen.getByText('تاریخ سفر')).toBeInTheDocument()
  })

  it('renders all date fields', () => {
    render(<DateTimePicker onChange={mockOnChange} />)
    
    expect(screen.getByText('سال')).toBeInTheDocument()
    expect(screen.getByText('ماه')).toBeInTheDocument()
    expect(screen.getByText('روز')).toBeInTheDocument()
  })

  it('renders time fields when includeTime is true', () => {
    render(<DateTimePicker onChange={mockOnChange} includeTime={true} />)
    
    expect(screen.getByText('ساعت')).toBeInTheDocument()
    expect(screen.getByText('دقیقه')).toBeInTheDocument()
  })

  it('does not render time fields when includeTime is false', () => {
    render(<DateTimePicker onChange={mockOnChange} includeTime={false} />)
    
    expect(screen.queryByText('ساعت')).not.toBeInTheDocument()
    expect(screen.queryByText('دقیقه')).not.toBeInTheDocument()
  })

  it('shows error message', () => {
    render(
      <DateTimePicker
        onChange={mockOnChange}
        error="تاریخ الزامی است"
      />
    )
    expect(screen.getByText('تاریخ الزامی است')).toBeInTheDocument()
  })

  it('shows helper text', () => {
    render(
      <DateTimePicker
        onChange={mockOnChange}
        helperText="تاریخ مورد نظر را انتخاب کنید"
      />
    )
    expect(screen.getByText('تاریخ مورد نظر را انتخاب کنید')).toBeInTheDocument()
  })

  it('displays validation error for past dates when validatePast is true', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // Yesterday
    
    render(
      <DateTimePicker
        value={pastDate.toISOString()}
        onChange={mockOnChange}
        validatePast={true}
        includeTime={true}
      />
    )
    
    // The component should show validation error for past dates
    expect(screen.getByText(/تاریخ و ساعت نباید در گذشته باشد/)).toBeInTheDocument()
  })

  it('calls onChange when month is changed', () => {
    render(<DateTimePicker onChange={mockOnChange} includeTime={false} />)
    
    const monthSelect = screen.getByRole('combobox')
    fireEvent.change(monthSelect, { target: { value: '6' } })
    
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('initializes with current date when no value provided', () => {
    const now = new Date()
    render(<DateTimePicker onChange={mockOnChange} includeTime={false} />)
    
    // Check that month select has current month as default
    const monthSelect = screen.getByRole('combobox') as HTMLSelectElement
    expect(parseInt(monthSelect.value)).toBe(now.getMonth() + 1)
  })

  it('parses ISO string value correctly', () => {
    const testDate = '2025-06-15T14:30:00.000Z'
    render(
      <DateTimePicker
        value={testDate}
        onChange={mockOnChange}
        includeTime={true}
      />
    )
    
    // The month dropdown should show June (6)
    const monthSelect = screen.getByRole('combobox') as HTMLSelectElement
    expect(monthSelect.value).toBe('6')
  })
})

