# MaiAphrodite OS - Style Guidelines

**Crucial for AI Agents & Contributors:** This project follows a strict aesthetic. Do not deviate.

## Core Aesthetic: "Flat Pastel Goth"
- **Mood**: Cute but dark, nerdy, comfy, flat (no depth/blur).
- **Inspiration**: Linux ricing, Catppuccin themes, retro anime interfaces.
- **Anti-Patterns** (DO NOT USE):
  - Glassmorphism (Backdrop blur, translucent layers).
  - "Modern Web" gradients (Shiny, apple-style).
  - Neomorphism (Soft shadows).
  - Excessive rounded corners (Keep it moderate).

## Color Palette
**Source of Truth**: `src/app/globals.css` (Tailwind v4 Theme) and `public/assets/ai-character.png`.

| Element | Color | Hex | Notes |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | **Hot Pink** | `#FF69B4` | Official `--mai-primary`. High energy accent. |
| **Secondary Brand** | **Cyan** | `#00FFFF` | Official `--mai-secondary`. Cyber/Tech accent. |
| **Background (Dark)** | **Catppuccin Dark** | `#1E1E2E` | Official `--desktop-bg` start. Deep flat dark. |
| **Surface** | **Dark Surface** | `#2D2D3A` | Official `--mai-surface`. Slightly lighter for panels. |
| **Character Ink** | **Charcoal** | `#34323C` | Extracted from `ai-character.png`. Used for outlines/contrast. |
| **Text** | **Light Grey** | `#E0E0E0` | Standard readability. |
| **Border** | **Neon Pink** | `#FF69B4` | Used for borders in dark mode. |

**Theme Rules**:
- **Dark Mode (Default)**: Use `#1E1E2E` background with `#FF69B4` borders.
- **Light Mode**: Use `#FDFDD0` -> `#FFD1DC` gradient (Pastel Yellow/Pink).
- **Glassmorphism**: **DISABLED**. Use solid colors or high alpha (0.95+) only.

## Typography
- **Font**: Monospace for almost everything (Terminal vibe).
- **Weight**: Normal to Bold. Avoid thin weights.

## UI Components
- **Windows**: Solid dark backgrounds, thin pastel borders (1px solid `#F5C2E7` or `#CDD6F4`). No drop shadows (or very harsh flat shadows).
- **Buttons**: Flat pastel background, dark text on hover. Simple CSS transitions (opacity/color only).
- **Terminal**: The heart of the OS. Must remain perfectly flat and opaque.
