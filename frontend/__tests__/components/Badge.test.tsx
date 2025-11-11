import { render, screen } from '@testing-library/react'
import Badge from '@/components/Badge'

describe('Badge Component', () => {
  it('renders with text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('bg-green-100')
  })

  it('applies error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    expect(container.firstChild).toHaveClass('bg-yellow-100')
  })

  it('applies small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>)
    expect(container.firstChild).toHaveClass('text-xs')
  })

  it('applies medium size', () => {
    const { container } = render(<Badge size="md">Medium</Badge>)
    expect(container.firstChild).toHaveClass('text-sm')
  })
})

