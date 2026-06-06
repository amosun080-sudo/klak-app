# Motion & Animation Guidelines

Motion Principles
- Motion communicates system intelligence — every animation should feel purposeful.
- Prefer spring-based physics for interactions and light ease for page transitions.
- Keep duration tight: 160ms–420ms depending on complexity.

Page Transitions
- Shared element transitions for hero `BalanceCard` and charts.
- Navigation: 240ms spring with 20% overshoot for forward navigation, 180ms ease-out for back.

Microinteractions
- Buttons: 120–180ms spring for press, scale 0.98 with elevated shadow.
- Pull-to-refresh: elastic pull with progressive glow on the balance card.

Charts & Data
- Charts draw themselves with 600–900ms stroke animations; use staggered delays for multi-series.
- Sparklines: fade + upward translate on load.

Haptics & Feedback
- Use light impact on toggles, medium on successful payments.

Implementation notes
- Use native drivers where possible (`useNativeDriver: true`).
- Create shared animation primitives: `spring`, `timing`, `stagger`, `sharedElement`.
