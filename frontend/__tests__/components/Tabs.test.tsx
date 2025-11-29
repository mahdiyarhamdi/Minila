import { render, screen, fireEvent } from '@testing-library/react'
import Tabs from '@/components/Tabs'

describe('Tabs Component', () => {
  const mockTabs = [
    { id: 'tab1', label: 'Tab 1', count: 5 },
    { id: 'tab2', label: 'Tab 2', count: 10 },
  ]

  it('renders all tabs', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />)
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('shows count badges', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    const { container } = render(
      <Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />
    )
    const tab1Button = screen.getByText('Tab 1').closest('button')
    expect(tab1Button).toHaveClass('text-primary-600')
  })

  it('calls onChange when tab clicked', () => {
    const handleChange = jest.fn()
    render(<Tabs tabs={mockTabs} activeTab="tab1" onChange={handleChange} />)
    
    const tab2Button = screen.getByText('Tab 2')
    fireEvent.click(tab2Button)
    
    expect(handleChange).toHaveBeenCalledWith('tab2')
  })

  it('renders children', () => {
    render(
      <Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}}>
        <div>Tab Content</div>
      </Tabs>
    )
    expect(screen.getByText('Tab Content')).toBeInTheDocument()
  })

  it('has horizontal scroll container for mobile', () => {
    const { container } = render(
      <Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />
    )
    // Check that the scrollable container exists with overflow-x-auto class
    const scrollContainer = container.querySelector('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()
  })

  it('tab buttons have flex-shrink-0 for proper scroll behavior', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />)
    const tab1Button = screen.getByText('Tab 1').closest('button')
    expect(tab1Button).toHaveClass('flex-shrink-0')
  })

  it('tab buttons have whitespace-nowrap to prevent wrapping', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onChange={() => {}} />)
    const tab1Button = screen.getByText('Tab 1').closest('button')
    expect(tab1Button).toHaveClass('whitespace-nowrap')
  })
})

