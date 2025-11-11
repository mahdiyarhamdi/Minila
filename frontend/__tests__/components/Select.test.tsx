import { render, screen } from '@testing-library/react'
import Select from '@/components/Select'

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]

  it('renders with label', () => {
    render(<Select label="Test Select" options={mockOptions} />)
    expect(screen.getByText('Test Select')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={mockOptions} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Select options={mockOptions} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('shows helper text', () => {
    render(<Select options={mockOptions} helperText="Choose an option" />)
    expect(screen.getByText('Choose an option')).toBeInTheDocument()
  })
})

