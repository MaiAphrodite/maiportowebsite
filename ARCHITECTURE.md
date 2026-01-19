# MaiAphrodite Architecture

> A desktop-style portfolio web application with AI chat integration.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS 4 |
| Animation | Framer Motion |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Security | Cloudflare Turnstile |
| Package Manager | Bun |

---

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (serverless functions)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
│
├── features/               # Feature modules (domain-driven)
│   ├── chat/               # AI chat streaming feature
│   │   ├── components/     # Chat-specific components
│   │   ├── hooks/          # Chat hooks (useChat, etc.)
│   │   ├── context/        # Chat state management
│   │   └── index.ts        # Public exports
│   │
│   ├── desktop/            # Desktop shell (windows, taskbar, icons)
│   │   ├── components/     # Window, Taskbar, Desktop, Icons
│   │   ├── context/        # Window management context
│   │   └── index.ts
│   │
│   ├── browser/            # In-app browser feature
│   │   ├── components/
│   │   └── index.ts
│   │
│   └── files/              # File explorer feature
│       ├── components/
│       ├── data/           # File system data
│       └── index.ts
│
└── shared/                 # Shared utilities & components
    ├── components/ui/      # Reusable UI primitives (Button, etc.)
    ├── hooks/              # Generic reusable hooks
    ├── lib/                # Utilities (cn, ai config, etc.)
    └── data/               # Shared static data
```

### Feature Module Structure

Each feature module follows this pattern:

```
features/<feature-name>/
├── components/           # Feature-specific React components
│   ├── FeatureMain.tsx   # Main component
│   └── FeaturePart.tsx   # Sub-components
├── hooks/                # Feature-specific hooks
├── context/              # Feature state (if needed)
├── types.ts              # Feature-specific types
└── index.ts              # Public API (barrel exports)
```

**Rule**: Only export from `index.ts`. Internal components stay internal.

---

## Coding Standards

### TypeScript

```typescript
// ✅ Prefer interfaces for object shapes
interface WindowProps {
  id: string;
  title: string;
  isMinimized: boolean;
}

// ✅ Use type for unions/aliases
type WindowState = 'open' | 'minimized' | 'maximized';

// ✅ Explicit return types for exported functions
export function createWindow(props: WindowProps): Window { }

// ❌ Avoid `any` - use `unknown` if truly unknown
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatStreamApp.tsx` |
| Hooks | camelCase with `use` prefix | `useWindowManager.ts` |
| Utilities | camelCase | `formatMessage.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WINDOWS` |
| Context | PascalCase + Context | `DesktopContext.tsx` |

### Component Guidelines

```typescript
// ✅ Prefer function components with explicit props
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant })} onClick={onClick}>
      {children}
    </button>
  );
}

// ✅ Co-locate styles with components when possible
// ✅ Extract hooks when logic is reusable
// ✅ Keep components under 200 lines - split if larger
```

---

## State Management

### Pattern: React Context + Hooks

```
┌─────────────────────────────────────────────┐
│                  AppContext                  │
│  (Global state: theme, user preferences)    │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌─────────┐
│ Desktop│  │   Chat   │  │ Browser │
│ Context│  │  Context │  │ Context │
└────────┘  └──────────┘  └─────────┘
```

**Rules**:
1. Feature-specific state lives in feature context
2. Cross-feature state lives in shared context
3. Component state stays local when possible
4. Avoid prop drilling > 2 levels deep

---

## Styling Conventions

### TailwindCSS

```typescript
// ✅ Use cn() for conditional classes
import { cn } from '@/shared/lib/utils';

<div className={cn(
  'rounded-lg p-4',
  isActive && 'bg-blue-500',
  variant === 'ghost' && 'bg-transparent'
)} />

// ✅ Extract complex styles to CVA variants
import { cva } from 'class-variance-authority';

const buttonVariants = cva('rounded-md font-medium', {
  variants: {
    size: {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: { size: 'md' },
});
```

### Animation

```typescript
// ✅ Use Framer Motion for complex animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
/>

// ✅ Use CSS transitions for simple hover/focus states
// ✅ Keep animations under 300ms for perceived performance
```

---

## AI/Agent Guardrails

> Guidelines for AI assistants and agents working on this codebase.

### Do

- ✅ Follow the feature-first structure when adding new features
- ✅ Place new components in the appropriate feature folder
- ✅ Update barrel exports (`index.ts`) when adding components
- ✅ Use existing UI primitives from `shared/components/ui/`
- ✅ Run `bun run lint` and `bun run build` before committing
- ✅ Keep commits atomic and focused on one change

### Don't

- ❌ Don't create new top-level folders in `src/` without discussion
- ❌ Don't add dependencies without justification
- ❌ Don't modify `shared/` components for feature-specific needs
- ❌ Don't skip TypeScript types or use `any`
- ❌ Don't commit directly to `main` - use feature branches

### Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, style, test, chore
Scope: chat, desktop, browser, files, shared, ci

Examples:
feat(chat): add typing indicator animation
fix(desktop): prevent window overflow on resize
refactor(shared): extract button variants to CVA
```

---

## API Design

### Route Handlers

```
src/app/api/
└── chat/
    └── route.ts    # POST /api/chat
```

**Patterns**:
- Use Vercel AI SDK's streaming helpers
- Validate input with runtime checks
- Return appropriate HTTP status codes
- Handle errors gracefully with user-friendly messages

---

## Import Aliases

```json
// tsconfig.json paths
{
  "@/*": ["./src/*"],
  "@/features/*": ["./src/features/*"],
  "@/shared/*": ["./src/shared/*"]
}
```

**Usage**:
```typescript
import { Button } from '@/shared/components/ui';
import { ChatStreamApp } from '@/features/chat';
import { useWindowManager } from '@/features/desktop';
```

---

## Performance

1. **Code Splitting**: Each feature auto-splits via dynamic imports
2. **Images**: Use Next.js `<Image>` with proper sizing
3. **Fonts**: Use `next/font` for optimized font loading
4. **Bundle**: Keep client bundles lean - prefer server components

---

## Security

1. **Turnstile**: Client-side bot protection on chat endpoint
2. **Env Variables**: Never expose server secrets to client
3. **Sanitization**: Sanitize user input before rendering
4. **Rate Limiting**: Apply on API routes (TODO)
