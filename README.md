This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture

This project follows a **feature-first, domain-driven architecture**.
Please read [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed guidelines.

### Structure

- `src/features/`: Domain-specific modules (chat, desktop, etc.)
- `src/shared/`: Shared utilities and UI primitives
- `src/app/`: Next.js App Router

## Getting Started

First, run the development server:

```bash
bun run dev
```

Run checks before committing:

```bash
bun run lint
bunx tsc --noEmit
```
