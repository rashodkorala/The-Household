# The Household

A household expense splitting app that makes sharing costs with your housemates simple and transparent. Track who paid, who owes what, and settle up with mutual confirmation — no more awkward money conversations.

## Features

- **Expense Tracking** — Log expenses with descriptions, categories, and flexible split options (equal, selected members, or custom amounts)
- **Smart Balances** — See at a glance how much you owe and how much you're owed
- **Settle Up with Verification** — Both parties must confirm a settlement before balances are adjusted. The payer confirms "I paid" and the receiver confirms "I got paid"
- **Expense Detail View** — View full breakdown of any expense including per-member settlement status with progress indicators
- **Household Groups** — Create a household and invite members with a 6-character invite code
- **Real-time Updates** — Changes sync across all members via Supabase real-time subscriptions
- **Mobile-First PWA** — Installable as a web app on iPhone/Android with full safe area support

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Supabase project

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/rashodkorala/The-Household.git
cd The-Household
pnpm install
```

2. Create a `.env` file in `apps/web/`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the SQL migrations in order in your Supabase SQL Editor:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_functions.sql
supabase/migrations/004_add_expense_rpc.sql
supabase/migrations/005_update_expense_rpc.sql
supabase/migrations/006_settlement_confirmations.sql
```

4. Start the dev server:

```bash
pnpm dev
```

---

## Technical Details

### Architecture

Monorepo using pnpm workspaces:

```
The-Household/
├── apps/
│   └── web/          # React SPA (Vite + TypeScript)
├── packages/
│   └── shared/       # Shared types (stub)
├── supabase/
│   └── migrations/   # SQL schema, RLS, and RPC functions
├── pnpm-workspace.yaml
└── package.json
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3 with custom design tokens |
| State | Zustand (auth, household, expense stores) |
| Routing | React Router v6 with protected routes |
| Backend | Supabase (Postgres, Auth, Real-time, RLS) |
| Deployment | Vercel |

### Database Design

All tables use `bigint generated always as identity` primary keys (not UUIDs) per Supabase best practices. Money is stored as integer cents to avoid floating point errors.

**Tables:** `households`, `members`, `expenses`, `expense_splits`, `settlements`

All foreign key columns are indexed. Row Level Security is enforced on every table with policies scoped to `authenticated` role only.

### RPC Functions (security definer)

Complex multi-table operations use `security definer` functions to avoid RLS chicken-and-egg problems:

- `create_household` — Creates household + first member atomically
- `join_household` — Validates invite code and adds member
- `add_expense` — Inserts expense + splits in one transaction
- `update_expense` — Verifies creator ownership, updates expense + replaces splits
- `request_settlement` — Creates a settlement with initiator's side auto-confirmed
- `confirm_settlement` — The other party confirms their side

### Settlement Verification Flow

1. Either party initiates a settlement → their side is auto-confirmed
2. The other party sees a pending settlement with a "Confirm I paid" / "Confirm I got paid" button
3. Only fully confirmed settlements adjust balances
4. Pending settlements are visible but do not affect the "You owe" / "You are owed" calculations

### Design System

| Token | Value |
|-------|-------|
| Display font | Cormorant Garamond |
| Heading font | Playfair Display |
| Body font | Libre Baskerville |
| UI font | Inter |
| Background | `#F5F2ED` |
| Surface | `#FAFAF8` |
| Accent (red) | `#C8513A` |
| Positive (green) | `#3A7D5C` |
| Text primary | `#1A1A18` |

### PWA / Mobile

- Standalone web app mode via `manifest.json`
- `apple-mobile-web-app-capable` for iOS Safari "Add to Home Screen"
- Safe area insets for iPhone notch and home indicator
- 48px minimum touch targets (Apple HIG)
- Hidden scrollbars, no tap highlight, no iOS input zoom (16px min font)
- `100dvh` for correct viewport height on mobile browsers
