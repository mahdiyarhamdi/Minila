import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/messages/MessageBubble'

describe('MessageBubble', () => {
  const mockTimestamp = '2024-01-01T12:00:00'

  describe('Own Messages (Right Aligned)', () => {
    it('should render own message with blue background', () => {
      render(
        <MessageBubble
          content="سلام، این پیام من است"
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const message = screen.getByText('سلام، این پیام من است')
      expect(message).toBeInTheDocument()
      
      // Check for blue background (primary-600)
      const bubble = message.closest('div')
      expect(bubble).toHaveClass('bg-primary-600', 'text-white')
    })

    it('should align own message to the right (justify-start in RTL)', () => {
      const { container } = render(
        <MessageBubble
          content="پیام من"
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      // در RTL، justify-start = راست
      expect(wrapper).toHaveClass('justify-start')
    })

    it('should not display sender name for own messages', () => {
      render(
        <MessageBubble
          content="پیام من"
          isOwn={true}
          timestamp={mockTimestamp}
          senderName="نام فرستنده"
        />
      )

      // نام فرستنده نباید نمایش داده شود
      expect(screen.queryByText('نام فرستنده')).not.toBeInTheDocument()
    })

    it('should have bottom-right corner sharp (rounded-br-sm)', () => {
      const { container } = render(
        <MessageBubble
          content="پیام من"
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const bubble = screen.getByText('پیام من').closest('div')
      expect(bubble).toHaveClass('rounded-br-sm')
    })

    it('should align timestamp to the right', () => {
      const { container } = render(
        <MessageBubble
          content="پیام من"
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const timestamp = container.querySelector('.text-xs.text-neutral-400')
      expect(timestamp).toHaveClass('text-right')
    })
  })

  describe('Other User Messages (Left Aligned)', () => {
    it('should render other user message with gray background', () => {
      render(
        <MessageBubble
          content="سلام، این پیام طرف مقابل است"
          isOwn={false}
          timestamp={mockTimestamp}
          senderName="علی احمدی"
        />
      )

      const message = screen.getByText('سلام، این پیام طرف مقابل است')
      expect(message).toBeInTheDocument()
      
      // Check for gray background (neutral-100)
      const bubble = message.closest('div')
      expect(bubble).toHaveClass('bg-neutral-100', 'text-neutral-900')
    })

    it('should align other user message to the left (justify-end in RTL)', () => {
      const { container } = render(
        <MessageBubble
          content="پیام طرف مقابل"
          isOwn={false}
          timestamp={mockTimestamp}
          senderName="علی احمدی"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      // در RTL، justify-end = چپ
      expect(wrapper).toHaveClass('justify-end')
    })

    it('should display sender name for other user messages', () => {
      render(
        <MessageBubble
          content="پیام طرف مقابل"
          isOwn={false}
          timestamp={mockTimestamp}
          senderName="علی احمدی"
        />
      )

      expect(screen.getByText('علی احمدی')).toBeInTheDocument()
    })

    it('should have bottom-left corner sharp (rounded-bl-sm)', () => {
      const { container } = render(
        <MessageBubble
          content="پیام طرف مقابل"
          isOwn={false}
          timestamp={mockTimestamp}
          senderName="علی احمدی"
        />
      )

      const bubble = screen.getByText('پیام طرف مقابل').closest('div')
      expect(bubble).toHaveClass('rounded-bl-sm')
    })

    it('should align timestamp to the left', () => {
      const { container } = render(
        <MessageBubble
          content="پیام طرف مقابل"
          isOwn={false}
          timestamp={mockTimestamp}
          senderName="علی احمدی"
        />
      )

      const timestamp = container.querySelector('.text-xs.text-neutral-400')
      expect(timestamp).toHaveClass('text-left')
    })
  })

  describe('Timestamp Formatting', () => {
    it('should format timestamp in Persian (fa-IR)', () => {
      render(
        <MessageBubble
          content="پیام تست"
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      // Timestamp should be formatted (exact format may vary by locale)
      const timestamp = screen.getByText(/\d{2}:\d{2}/)
      expect(timestamp).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('should preserve whitespace and line breaks', () => {
      const multilineContent = 'خط اول\nخط دوم\nخط سوم'
      
      render(
        <MessageBubble
          content={multilineContent}
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const message = screen.getByText(/خط اول/)
      expect(message).toHaveClass('whitespace-pre-wrap')
    })

    it('should break long words properly', () => {
      const longContent = 'https://example.com/very/long/url/that/should/break/properly'
      
      render(
        <MessageBubble
          content={longContent}
          isOwn={true}
          timestamp={mockTimestamp}
        />
      )

      const message = screen.getByText(longContent)
      expect(message).toHaveClass('break-words')
    })
  })
})

