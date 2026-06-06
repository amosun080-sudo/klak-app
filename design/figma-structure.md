# Figma-ready Layout Structure

Frame & Grid
- Frame size: 390 x 844 (iPhone 14). Provide variants for 360x800 (Android) and 428x926 (iPhone 14 Pro Max).
- Grid: 12-column layout with 16px gutters. Vertical spacing based on `tokens/spacing.json`.

Component Naming
- Use atomic naming: `Atoms/Buttons/Primary`, `Molecules/Cards/BalanceCard`, `Organisms/Dashboard/Hero`.

Variants
- Create component variants for sizes, states, and motion-ready instances (default, pressed, loading).

Shared styles
- Create color styles mapping to `tokens/colors.json` and text styles to `tokens/typography.json`.

Exporting
- Export components as PNG @2x and vector icons as SVG.

Shared element setup
- Create a top-level `SharedElements` page to map component IDs used for transitions.
