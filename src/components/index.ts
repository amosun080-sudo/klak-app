// ── Layout components ─────────────────────────────────────────────────────────
export {
  ScreenHeader,
  SectionLabel,
  Divider,
  Card,
  Button,
  IconButton,
  PlanBadge,
  Skeleton,
  EmptyState,
  PlanGate,
} from './layout/index';

// ── Data display components ───────────────────────────────────────────────────
// Use data/index.tsx versions — these accept the typed model objects (Transaction, Budget, Insight)
export {
  BalanceCard,
  AccountRow,
  AddAccountRow,
  TransactionItem,
  BudgetBar,
  InsightCard,
  SpendSummaryRow,
  OverallBudgetCard,
} from './data/index';

// Supplemental data display components (design-system primitives, not model-dependent)
export {
  PieSegment,
  MonthPicker,
} from './data/enhanced';

// ── Form components ───────────────────────────────────────────────────────────
// Base forms (used in auth and simple inputs)
export {
  LabelledInput,
  PhoneInput as PhoneInputBase,
  OTPInput as OTPInputBase,
  CurrencyInput as CurrencyInputBase,
} from './forms/index';

// Enhanced form components
export {
  PhoneInput,
  OTPInput,
  CurrencyInput,
  CategoryPicker,
  LanguageToggle,
  SearchInput,
  Checkbox,
  RadioGroup,
  Dropdown,
} from './forms/enhanced';

// ── Feedback components ───────────────────────────────────────────────────────
export {
  LoadingSkeleton,
  AlertBanner,
  Toast,
  ConfirmSheet,
  ProtectedRoute,
  KeyboardSheet,
} from './feedback/index';
