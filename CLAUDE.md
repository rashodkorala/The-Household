# The Household — Project Context

## What This Is

A household expense splitting PWA. Housemates log shared costs, split them flexibly, track who owes what, and settle up with mutual confirmation. Deployed on Vercel, backed by Supabase.

## Status: v1.0.0 Released

All core features are built and working. The app is live.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3, custom design tokens |
| State | Zustand (authStore, householdStore, expenseStore) |
| Routing | React Router v6, protected routes in `router.tsx` |
| Backend | Supabase (Postgres, Auth, Real-time, RLS) |
| Package manager | pnpm (workspaces) |
| Deployment | Vercel (root dir set to `apps/web`) |

## Monorepo Structure

```
The-Household/
├── apps/web/              # React SPA — the active app
│   ├── src/
│   │   ├── main.tsx       # Entry point, imports index.css
│   │   ├── App.tsx        # Routes + Layout (bottom nav)
│   │   ├── router.tsx     # ProtectedRoute component
│   │   ├── pages/         # All page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # useAuth, useHousehold, useExpenses, useSettlements, useRealtime
│   │   ├── store/         # Zustand stores
│   │   └── lib/           # supabase client, balances, settlements, vision
│   ├── public/            # logo.png, manifest.json, _redirects
│   ├── index.html         # PWA meta tags, font imports
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── apps/mobile/           # Stub — not built yet
├── packages/shared/       # Stub — not built yet
├── supabase/migrations/   # SQL files (run manually in Supabase SQL Editor)
└── package.json           # pnpm workspaces, packageManager field
```

---

## Database

All tables use `bigint generated always as identity` PKs (not UUIDs). Money stored as integer cents. All FK columns indexed. RLS enforced on every table.

### Tables
- **households** — id, name, invite_code, created_at
- **members** — id, household_id, user_id, display_name, avatar_color, joined_at
- **expenses** — id, household_id, description, amount (cents), category, paid_by, split_type, created_by, created_at
- **expense_splits** — id, expense_id, member_id, amount (cents)
- **settlements** — id, household_id, from_member, to_member, amount (cents), confirmed_by_from, confirmed_by_to, note, settled_at

### SQL Migrations (in order)
1. `001_schema.sql` — Tables, constraints, indexes
2. `002_rls.sql` — RLS policies, `my_household_id()` helper, grants for authenticated
3. `003_functions.sql` — `create_household`, `join_household` RPCs (security definer)
4. `004_add_expense_rpc.sql` — `add_expense` RPC
5. `005_update_expense_rpc.sql` — `update_expense` RPC (verifies created_by)
6. `006_settlement_confirmations.sql` — Adds confirmed_by_from/to columns, `request_settlement` and `confirm_settlement` RPCs

### RPC Functions (all security definer, set search_path = '')
- `create_household(name, display_name)` — Creates household + first member atomically
- `join_household(invite, display_name)` — Validates invite code, adds member
- `add_expense(...)` — Inserts expense + splits in one transaction
- `update_expense(...)` — Verifies `created_by = auth.uid()`, updates expense + replaces splits
- `request_settlement(from, to, amount)` — Creates settlement, auto-confirms initiator's side
- `confirm_settlement(id)` — Other party confirms their side

---

## Key Patterns & Decisions

### Auth Flow
1. `useAuth()` called once in `App.tsx` — sets up `onAuthStateChange`
2. `ProtectedRoute` checks `authLoading` first, then `user`, then `householdLoading`
3. No user → `/login`. No household → `/household-setup`. Has household → `/dashboard`
4. Settings page calls `supabase.auth.signOut()` directly (not `useAuth()` — avoids re-render loop)

### RLS Workarounds
- Multi-table inserts (household+member, expense+splits) use `security definer` RPCs to avoid chicken-and-egg SELECT issues
- Splits passed as JSONB array directly (not `JSON.stringify` — that double-encodes)
- RLS uses `(select auth.uid())` wrapping for performance

### State Management
- Individual selectors like `useExpenseStore((s) => s.expenses)` to avoid re-render loops
- Never call `useAuth()` in child components — only in `App.tsx`

### Settlement Verification
- Both parties must confirm before balances adjust
- `adjustBalancesForSettlements()` skips unconfirmed settlements
- Dashboard and SettleUp both use the shared `useSettlements` hook

### Money
- All amounts in integer cents
- `toCents(dollars)` on input, `formatCAD(cents)` on display
- Uses `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`

### Mobile / PWA
- `manifest.json` with `display: standalone`
- `apple-mobile-web-app-capable` meta tag
- Safe area insets via CSS `env()` variables
- `100dvh` for viewport height
- 48px min touch targets, hidden scrollbars, no iOS input zoom (16px min font)
- Bottom nav has `backdrop-blur`, `z-50`, safe area padding

---

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | Login.tsx | Email/password sign in, redirects if authenticated |
| `/register` | Register.tsx | Email/password sign up |
| `/household-setup` | HouseholdSetup.tsx | Create or join household with invite code |
| `/dashboard` | Dashboard.tsx | Balance cards, monthly total, recent expenses, quick actions |
| `/expenses` | Expenses.tsx | Full expense list with ExpenseCard components |
| `/add-expense` | AddExpense.tsx | Amount input, description, category pills, paid-by, SplitSelector, receipt scanner |
| `/expense/:id` | ExpenseDetail.tsx | View/edit/delete expense (creator only), settlement status per split with progress bars |
| `/settle-up` | SettleUp.tsx | Pending confirmations, outstanding transfers, settlement history |
| `/settings` | Settings.tsx | Edit household name, copy invite code, edit display name, members list, sign out |

## Components

| Component | Purpose |
|-----------|---------|
| BalanceBar | "You owe" / "You are owed" cards with member avatars |
| ExpenseCard | Clickable expense row → navigates to `/expense/:id` |
| SplitSelector | Equal all / selected / custom split modes with preview |
| SettlementItem | Settlement with confirmation badges, confirm buttons, status |
| MemberAvatar | Circle with initials and custom color |
| ReceiptScanner | Google Vision API receipt scanning (optional) |

## Hooks

| Hook | Purpose |
|------|---------|
| useAuth | Sign in/up/out, onAuthStateChange (called only in App.tsx) |
| useHousehold | Fetch/create/join household, fetch members |
| useExpenses | Fetch/add/update/delete expenses via RPCs |
| useSettlements | Fetch settlements, request/confirm settlement |
| useRealtime | Supabase real-time subscriptions for expenses and settlements |

---

## Design System

| Token | Value |
|-------|-------|
| Display font | Cormorant Garamond (300-400, big numbers) |
| Heading font | Playfair Display (400-600, titles) |
| Body font | Libre Baskerville (400, descriptions) |
| UI font | Inter (300-600, buttons/inputs/meta) |
| Background | `#F5F2ED` |
| Surface | `#FAFAF8` |
| Surface alt | `#EFEDE8` |
| Border | `#E4E1DA` |
| Border strong | `#C9C5BC` |
| Text primary | `#1A1A18` |
| Text secondary | `#6B6860` |
| Text muted | `#A8A49C` |
| Accent (red) | `#C8513A` |
| Positive (green) | `#3A7D5C` |
| Button | `#1A1A18` bg, `#FAFAF8` text |
| Card shadow | `0 1px 3px rgba(0,0,0,0.06)` |
| Max width | 480px |

---

## Environment Variables

```bash
# apps/web/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VISION_API_KEY=your-google-vision-key  # optional, for receipt scanning
```

## Build & Deploy

```bash
pnpm install
pnpm dev              # Start dev server
pnpm build            # TypeScript check + Vite build
```

Vercel config: Root Directory = `apps/web`, Framework = Vite, Install Command = `cd ../.. && pnpm install`.

---

## Known Issues / Past Bugs (resolved)

- `.single()` → use `.maybeSingle()` to avoid 406 on empty results
- RLS chicken-and-egg on inserts → use security definer RPCs
- `JSON.stringify` on RPC JSONB params → pass arrays directly
- `useAuth()` in child components → causes infinite re-renders
- `computeSettlements` crash on empty balances → guard for `entries.length < 2`
- Supabase client with empty URL → use placeholder fallback

## Out of Scope (v2+)

- React Native mobile app
- Shared business logic package
- Push notifications
- Multiple households per user
- Multi-currency support
- Recurring expenses
- In-app payments
