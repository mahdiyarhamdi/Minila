# 🧪 راهنمای تست - Minila Frontend

این مستند راهنمای کامل برای نوشتن و اجرای تست‌ها در پروژه Minila است.

---

## 📋 فهرست مطالب

1. [نصب و تنظیمات](#نصب-و-تنظیمات)
2. [ساختار تست‌ها](#ساختار-تست‌ها)
3. [اجرای تست‌ها](#اجرای-تست‌ها)
4. [نوشتن تست](#نوشتن-تست)
5. [Mock کردن](#mock-کردن)
6. [Coverage](#coverage)

---

## 🔧 نصب و تنظیمات

### نصب Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

### تنظیم Jest

فایل `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

فایل `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

### تنظیم package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 📁 ساختار تست‌ها

```
frontend/
├── __tests__/
│   ├── components/           # تست کامپوننت‌ها
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── Select.test.tsx
│   │   ├── Badge.test.tsx
│   │   ├── Modal.test.tsx
│   │   └── Tabs.test.tsx
│   ├── hooks/                # تست custom hooks
│   │   ├── useCards.test.ts
│   │   ├── useCommunities.test.ts
│   │   └── useMessages.test.ts
│   ├── pages/                # تست صفحات
│   │   ├── cards.test.tsx
│   │   ├── communities.test.tsx
│   │   └── messages.test.tsx
│   └── lib/                  # تست utilities
│       └── api.test.ts
├── jest.config.js
└── jest.setup.js
```

---

## 🏃 اجرای تست‌ها

### اجرای تمام تست‌ها

```bash
npm test
```

### اجرای یک فایل خاص

```bash
npm test Button.test.tsx
```

### اجرای با Watch Mode

```bash
npm run test:watch
```

### اجرای با Coverage

```bash
npm run test:coverage
```

### اجرای در CI/CD

```bash
npm run test:ci
```

---

## ✍️ نوشتن تست

### تست کامپوننت ساده

```typescript
import { render, screen } from '@testing-library/react'
import Button from '@/components/Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    const button = screen.getByText('Click')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### تست کامپوننت با Props

```typescript
describe('Badge Component', () => {
  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('bg-green-100')
  })

  it('applies error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })
})
```

### تست Form با User Interaction

```typescript
import userEvent from '@testing-library/user-event'

describe('Login Form', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()
    
    render(<LoginForm onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText('ایمیل'), 'test@example.com')
    await user.click(screen.getByText('ورود'))
    
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
    })
  })
})
```

### تست Custom Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCards } from '@/hooks/useCards'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCards Hook', () => {
  it('fetches cards successfully', async () => {
    const { result } = renderHook(() => useCards(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### تست صفحه

```typescript
import { render, screen } from '@testing-library/react'
import CardsPage from '@/app/cards/page'

jest.mock('@/hooks/useCards', () => ({
  useCards: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    error: null,
  }),
}))

describe('Cards Page', () => {
  it('renders cards list heading', () => {
    render(<CardsPage />)
    expect(screen.getByText('کارت‌های سفر و بار')).toBeInTheDocument()
  })
})
```

---

## 🎭 Mock کردن

### Mock API Service

```typescript
jest.mock('@/lib/api')

describe('Component with API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches data from API', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(apiService.getData as jest.Mock).mockResolvedValue(mockData)

    // ... test code
  })
})
```

### Mock Next Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/cards',
}))
```

### Mock Custom Hook

```typescript
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isLoading: false,
    isAuthenticated: true,
  }),
}))
```

### Mock Component

```typescript
jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div>Mocked Navbar</div>
  }
})
```

---

## 📊 Coverage

### اجرای Coverage Report

```bash
npm run test:coverage
```

### خواندن Coverage Report

پس از اجرا، فایل‌های HTML در پوشه `coverage/lcov-report/` ایجاد می‌شوند:

```bash
open coverage/lcov-report/index.html
```

### هدف Coverage

```
Statements   : 80% minimum
Branches     : 75% minimum
Functions    : 80% minimum
Lines        : 80% minimum
```

### تنظیم Coverage Thresholds

در `jest.config.js`:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
}
```

---

## 🔍 بهترین روش‌ها (Best Practices)

### 1. نام‌گذاری تست‌ها

```typescript
// ✅ خوب
it('renders button with primary variant', () => {})
it('shows error message when validation fails', () => {})

// ❌ بد
it('works', () => {})
it('test 1', () => {})
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('submits form correctly', () => {
  // Arrange
  const handleSubmit = jest.fn()
  render(<Form onSubmit={handleSubmit} />)

  // Act
  fireEvent.click(screen.getByText('Submit'))

  // Assert
  expect(handleSubmit).toHaveBeenCalled()
})
```

### 3. استفاده از Data-testid

```typescript
// در کامپوننت
<button data-testid="submit-button">Submit</button>

// در تست
const button = screen.getByTestId('submit-button')
```

### 4. تست Accessibility

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 5. Cleanup بعد از هر تست

```typescript
afterEach(() => {
  jest.clearAllMocks()
  cleanup()
})
```

---

## 📝 چک‌لیست تست

برای هر کامپوننت:

- [ ] Rendering اولیه
- [ ] Props مختلف
- [ ] User interactions
- [ ] Error states
- [ ] Loading states
- [ ] Edge cases
- [ ] Accessibility

برای هر صفحه:

- [ ] Rendering با داده
- [ ] Rendering بدون داده (Empty State)
- [ ] Loading state
- [ ] Error state
- [ ] Navigation
- [ ] Form submission

برای هر Hook:

- [ ] Return value در حالت موفق
- [ ] Return value در حالت خطا
- [ ] Loading state
- [ ] Refetch/Mutation

---

## 🐛 رفع مشکلات رایج

### مشکل: Cannot find module '@/...'

**راه‌حل**: بررسی `moduleNameMapper` در `jest.config.js`

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### مشکل: Hook can only be used inside QueryClientProvider

**راه‌حل**: استفاده از wrapper

```typescript
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)
```

### مشکل: Cannot use import statement outside a module

**راه‌حل**: تنظیم transform در `jest.config.js`

```javascript
transform: {
  '^.+\\.(ts|tsx)$': ['@swc/jest', { /* config */ }],
}
```

---

## 📚 منابع مفید

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎯 تست‌های موجود

### کامپوننت‌ها
- ✅ Button
- ✅ Input
- ✅ Select
- ✅ Badge
- ✅ Modal
- ✅ Tabs
- ⏳ Card
- ⏳ Textarea
- ⏳ Toast
- ⏳ Navbar

### Hooks
- ✅ useCards
- ⏳ useCommunities
- ⏳ useMessages
- ⏳ useAuth

### صفحات
- ✅ Cards List
- ⏳ Card Detail
- ⏳ Communities
- ⏳ Messages

---

**نسخه مستند**: 1.0.0  
**آخرین به‌روزرسانی**: ۲۰۲۵-۱۱-۱۱

