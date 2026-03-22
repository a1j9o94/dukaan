# दुकान Design System

## Visual Theme & Atmosphere
Warm, approachable mobile-first retail tool for a Hindi-speaking clothing store owner. The aesthetic should feel like a clean, modern cash register — not a developer dashboard. Light background with warm saffron accents, generous touch targets, and Hindi typography throughout.

## Color Palette
- **Primary (Saffron)**: `oklch(0.58 0.16 45)` — buttons, active tabs, stock counts > 0
- **Background**: `oklch(0.985 0.002 75)` — warm off-white page background
- **Card**: `oklch(1 0 0)` — pure white card surfaces
- **Foreground**: `oklch(0.15 0.01 75)` — primary text
- **Muted**: `oklch(0.55 0.01 75)` — secondary labels, SKUs, dates
- **Destructive**: `oklch(0.55 0.2 27)` — out-of-stock (0), errors
- **Success (Emerald)**: emerald-600 — positive stock counts, profit, purchase events
- **Blue**: blue-700 — sale events in timeline
- **Red**: red-700 — expense events in timeline

## Typography
- **Font**: Noto Sans Devanagari (400, 500, 600, 700)
- **Headings**: 18px bold (page titles), 14px semibold (section headers)
- **Body**: 14px regular
- **Small/Labels**: 12px, muted color
- **Numbers**: tabular-nums for alignment, standard digits (not Devanagari)
- **Mono**: font-mono for SKU codes

## Layout Principles
- **Max width**: 448px (max-w-lg), centered
- **Tab bar**: Fixed bottom, 56px height, always visible
- **Page content**: Must have `pb-20` (80px) to clear the tab bar
- **Sheets/Dialogs**: Must account for tab bar — add bottom padding or hide tab bar
- **Touch targets**: Minimum 44px height on all interactive elements
- **Cards**: rounded-lg border, 12px padding
- **Spacing**: 16px page padding (px-4), 8px between cards (space-y-2)

## Component Patterns
- **ProductPicker dropdown**: Must render above sibling elements (z-50), with backdrop to close
- **Cart items**: Bordered rows with X remove button, showing qty × price = total
- **Filter chips**: Row of pill buttons, active = primary filled, inactive = outline
- **Bottom sheets**: Rounded top corners, slide up from bottom, must clear tab bar
- **Success toasts**: Inline green text with ✓, auto-dismiss after 3s
- **Empty states**: Centered emoji + Hindi text
