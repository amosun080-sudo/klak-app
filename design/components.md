# Component Library — KLAK

Foundational principles
- Deep black surfaces with glassmorphic cards
- High-contrast typography and massive balance numbers
- Minimal chrome, maximum depth

Core components

- `BalanceCard`
  - Purpose: hero component showing Total Balance, AI score, actions
  - Anatomy: background gradient, frosted glass container, balance number (count-up), small metadata row, CTA pill buttons
  - States: default, collapsed, expanded (shared element transition)

- `InsightCard`
  - Purpose: AI-generated insight with confidence score and quick actions
  - Anatomy: left icon, title, short text, predicted impact tag, CTA
  - Motion: slide & fade on load, micro bounce on reveal

- `CategoryCard`
  - Purpose: budget/category summary with progress ring
  - Anatomy: circular progress, merchant/emoji, category title, spent/limit, sparkline

- `TransactionRow`
  - Purpose: fast list item for transactions
  - Anatomy: merchant avatar, title, category, amount, timestamp
  - Interaction: swipe actions (archive, dispute), tap to expand inline details

- `PricingTable`
  - Purpose: subscription conversion component
  - Anatomy: three columns, highlighted recommended plan with gold accent, animated feature reveal

Tokens & usage
- Use `tokens/colors.json`, `tokens/typography.json`, and `tokens/spacing.json` for consistent styling.
- Cards: use `glass.frost` with backdrop blur (Figma: 18-24px), 1px bright border with 8% white, and subtle elevated shadow.

Accessibility
- Contrast: primary text must meet 4.5:1 on black surfaces.
- Tap targets: minimum 44x44dp.
