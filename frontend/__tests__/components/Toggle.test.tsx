import { render, screen, fireEvent } from '@testing-library/react'
import Toggle from '@/components/Toggle'

describe('Toggle Component', () => {
  it('renders with label', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Test Toggle" />)
    expect(screen.getByText('Test Toggle')).toBeInTheDocument()
  })

  it('renders without label', () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} />)
    expect(container.querySelector('button[role="switch"]')).toBeInTheDocument()
  })

  it('shows checked state correctly', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Checked Toggle" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('shows unchecked state correctly', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Unchecked Toggle" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} label="Click Toggle" />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with opposite value', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={true} onChange={handleChange} label="Click Toggle" />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange when disabled', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} disabled={true} label="Disabled Toggle" />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('shows helper text when provided', () => {
    render(<Toggle checked={false} onChange={() => {}} helperText="This is helper text" />)
    expect(screen.getByText('This is helper text')).toBeInTheDocument()
  })

  it('applies disabled styling when disabled', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled={true} label="Disabled Toggle" />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('toggles on label click', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} label="Clickable Label" />)
    
    const label = screen.getByText('Clickable Label')
    fireEvent.click(label)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('handles keyboard navigation - Enter key', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} label="Keyboard Toggle" />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.keyDown(toggle, { key: 'Enter' })
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('handles keyboard navigation - Space key', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} label="Keyboard Toggle" />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.keyDown(toggle, { key: ' ' })
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('renders label on left when labelPosition is left', () => {
    const { container } = render(
      <Toggle checked={false} onChange={() => {}} label="Left Label" labelPosition="left" />
    )
    
    const flexContainer = container.querySelector('.flex')
    const children = flexContainer?.children
    
    // Label should be first child when position is left
    expect(children?.[0]).toHaveTextContent('Left Label')
  })
})



