# Household Bill Splitter — Monorepo

## Project Overview

A real-time household expense splitting app. Housemates log shared costs, split them flexibly, track who owes what, and settle up. The repo is structured as a monorepo to support a React Native mobile app later. **For now, only the web app is being built.**

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/                        # ✅ Active — build this now
│   └── mobile/                     # 🔜 Stubbed — do not build yet
├── packages/
│   └── shared/                     # 🔜 Stubbed — do not build yet
├── package.json                    # root workspace config
├── .gitignore
└── CLAUDE.md
```

### Root `package.json`

```json
{
  "name": "household-splitter",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web"
  }
}
```

### Stub `apps/mobile`

Create `apps/mobile/.gitkeep` — empty folder, nothing else.

### Stub `packages/shared`

Create `packages/shared/package.json`:

```json
{
  "name": "@splitter/shared",
  "version": "0.0.1",
  "main": "index.ts"
}
```

Create `packages/shared/index.ts`:

```ts
// Shared business logic — populated when mobile app is built
export {};
```

---

## Web App

### Location

`apps/web/`

### Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| State | Zustand |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Receipt scanning | Google Cloud Vision API |

### Folder Structure

```
apps/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── HouseholdSetup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Expenses.tsx
│   │   ├── AddExpense.tsx
│   │   ├── SettleUp.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ExpenseCard.tsx
│   │   ├── BalanceBar.tsx
│   │   ├── SplitSelector.tsx
│   │   ├── ReceiptScanner.tsx
│   │   ├── SettlementItem.tsx
│   │   └── MemberAvatar.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── householdStore.ts
│   │   └── expenseStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── vision.ts
│   │   ├── balances.ts
│   │   └── settlements.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useHousehold.ts
│       ├── useExpenses.ts
│       └── useRealtime.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env
```

### `apps/web/package.json`

```json
{
  "name": "@splitter/web",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "zustand": "^4"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitejs/plugin-react": "^4",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5",
    "vite": "^5"
  }
}
```

---

## Environment Variables

```bash
# apps/web/.env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VISION_API_KEY=
```

Never commit `.env`. Values come from:
- Supabase dashboard → Project Settings → API
- Google Cloud Console → Vision API → Credentials

Add `apps/web/.env` to `.gitignore`.

---

## Database Schema

Run this SQL in the Supabase SQL editor.

```sql
-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at timestamptz default now()
);

-- Members (links auth users to a household)
create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text default '#4ECDC4',
  joined_at timestamptz default now(),
  unique(household_id, user_id)
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  description text not null,
  amount integer not null,            -- stored in cents to avoid float errors
  currency text default 'CAD',
  category text,
  paid_by uuid references members(id),
  split_type text check (split_type in ('equal_all', 'equal_selected', 'custom')),
  receipt_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Per-member split amounts for each expense
create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade,
  member_id uuid references members(id),
  amount integer not null,            -- cents
  percentage numeric(5,2)
);

-- Recorded settlements
create table settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  from_member uuid references members(id),
  to_member uuid references members(id),
  amount integer not null,            -- cents
  note text,
  settled_at timestamptz default now()
);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table households enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table settlements enable row level security;

-- Helper: get current user's household_id
create or replace function my_household_id()
returns uuid language sql stable as $$
  select household_id from members where user_id = auth.uid() limit 1;
$$;

-- Households
create policy "members can read own household"
  on households for select using (id = my_household_id());

-- Members
create policy "read own household members"
  on members for select using (household_id = my_household_id());

create policy "insert self as member"
  on members for insert with check (user_id = auth.uid());

-- Expenses
create policy "read own household expenses"
  on expenses for select using (household_id = my_household_id());

create policy "insert own household expenses"
  on expenses for insert with check (household_id = my_household_id());

create policy "delete own expenses"
  on expenses for delete using (created_by = auth.uid());

-- Expense splits
create policy "read own household splits"
  on expense_splits for select
  using (expense_id in (
    select id from expenses where household_id = my_household_id()
  ));

create policy "insert own household splits"
  on expense_splits for insert
  with check (expense_id in (
    select id from expenses where household_id = my_household_id()
  ));

-- Settlements
create policy "read own household settlements"
  on settlements for select using (household_id = my_household_id());

create policy "insert own household settlements"
  on settlements for insert with check (household_id = my_household_id());
```

---

## Core Logic

### `lib/balances.ts`

Takes all expenses with their splits. Returns net balance per member in cents.
Positive = is owed money. Negative = owes money.

```ts
// For each expense:
//   add expense.amount (cents) to paid_by member's balance
//   subtract each split.amount (cents) from that member's balance
// Return: Record<memberId, centsBalance>
```

### `lib/settlements.ts`

Greedy algorithm — minimum transfers to zero all balances.

```ts
// while any non-zero balance remains:
//   creditor = member with highest positive balance
//   debtor   = member with highest negative balance
//   transfer = min(creditor, abs(debtor))
//   push { from: debtor, to: creditor, amount: transfer }
//   reduce both balances by transfer
// return transfers[]
```

### `lib/vision.ts`

```ts
// POST base64 image to Vision API TEXT_DETECTION endpoint
// Parse response lines with regex for price patterns (\d+\.\d{2})
// Largest value candidate = total
// Remaining candidates = line items
// Multiply all values by 100 and round to convert to cents
// Return: { total: number, items: { name: string, amount: number }[] }
```

### `lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Money Handling

All amounts are stored and processed in **integer cents** to avoid floating point errors.

```ts
// Convert dollars to cents for storage
const toCents = (dollars: number) => Math.round(dollars * 100)

// Convert cents to display string
const formatCAD = (cents: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
    .format(cents / 100)
```

Use `toCents` on all user input before inserting to Supabase.
Use `formatCAD` everywhere amounts are displayed.

---

## App Flow

### Auth

1. User lands on `/login` or `/register`
2. On success, check for a `members` row for this `auth.uid()`
3. No member row → redirect to `/household-setup`
4. Member row exists → redirect to `/dashboard`
5. Protected routes redirect unauthenticated users to `/login`

### Household Setup (`/household-setup`)

Two options:

**Create** — user enters a household name, Postgres generates a 6-character invite code, insert household row then member row.

**Join** — user enters a 6-character invite code, look up household by `invite_code`, insert member row linking this user to that household.

### Add Expense (`/add-expense`)

Fields: description, amount (CAD dollars, convert to cents on submit), category, who paid (member dropdown).

Split type — three modes controlled by `SplitSelector`:

- `equal_all` — divide amount evenly across all members
- `equal_selected` — toggle which members are included, divide evenly among them
- `custom` — enter CAD amount or percentage per member, validate they sum to total before enabling submit

Receipt scanner (optional step):
1. User picks a photo or captures from camera
2. Convert to base64, POST to Vision API via `lib/vision.ts`
3. Pre-fill description and amount fields from result
4. Show extracted line items as a read-only review list
5. User confirms or edits before submitting

On submit:
1. Insert one row to `expenses`
2. Insert one row per member to `expense_splits`
3. Both must succeed — wrap in a Supabase RPC function or use `.rpc()` if atomicity is needed

### Dashboard (`/dashboard`)

- Net balance per member using `lib/balances.ts`
- Total household spend this month (sum of all expense amounts)
- Five most recent expenses
- Button linking to `/settle-up`

### Settle Up (`/settle-up`)

- Run `lib/settlements.ts` over current balances
- Each transfer shown as a card: "Alice pays Bob $34.50"
- "Mark as settled" inserts a row to `settlements`, re-runs balances
- Settlement history section below

### Settings (`/settings`)

- Edit household name
- Copy invite code to clipboard
- Edit own display name
- Sign out

---

## Realtime (`hooks/useRealtime.ts`)

```ts
supabase
  .channel('household-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'expenses',
    filter: `household_id=eq.${householdId}`
  }, () => refreshExpenses())
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'settlements',
    filter: `household_id=eq.${householdId}`
  }, () => refreshSettlements())
  .subscribe()
```

Call `useRealtime` once in the root layout after the user is authenticated.
Clean up the channel subscription on unmount.

---

## Categories

```ts
export const CATEGORIES = [
  'Groceries',
  'Rent',
  'Utilities',
  'Internet',
  'Takeaway',
  'Dining out',
  'Transport',
  'Subscriptions',
  'Household supplies',
  'Other',
] as const
```

---

## Build Order

Complete each step fully and test before starting the next.

### Step 1 — Monorepo scaffold
- Init root `package.json` with workspaces
- Scaffold `apps/web` with Vite + React + TypeScript + Tailwind + React Router + Zustand
- Create stub `apps/mobile/.gitkeep`
- Create stub `packages/shared/package.json` and `packages/shared/index.ts`
- Confirm `npm run dev` from root starts the web dev server
- Commit: `chore: monorepo scaffold`

### Step 2 — Supabase + schema
- Create Supabase project
- Run schema SQL in Supabase SQL editor
- Run RLS SQL in Supabase SQL editor
- Add `.env` with Supabase URL and anon key
- Create `lib/supabase.ts`
- Confirm Supabase client initialises without errors in the browser console
- Commit: `chore: supabase schema and client`

### Step 3 — Auth
- `store/authStore.ts` — session, user, loading state
- `hooks/useAuth.ts` — signUp, signIn, signOut, onAuthStateChange
- `pages/Login.tsx` and `pages/Register.tsx`
- Protected route wrapper in `router.tsx`
- Session persists on page refresh
- Commit: `feat: auth`

### Step 4 — Household setup
- `store/householdStore.ts` — household, members
- `hooks/useHousehold.ts` — create, join, fetch members
- `pages/HouseholdSetup.tsx` — create and join flows
- Redirect logic: new user → `/household-setup`, existing member → `/dashboard`
- Commit: `feat: household setup`

### Step 5 — Expenses list
- `hooks/useExpenses.ts` — fetch expenses with splits from Supabase
- `store/expenseStore.ts`
- `pages/Expenses.tsx` — list view
- `components/ExpenseCard.tsx`
- Commit: `feat: expenses list`

### Step 6 — Add expense
- `pages/AddExpense.tsx` — full form
- `components/SplitSelector.tsx` — equal_all, equal_selected, custom modes
- Insert to `expenses` + `expense_splits` on submit
- Form validation: splits must sum to total in custom mode
- Commit: `feat: add expense`

### Step 7 — Balances + dashboard
- `lib/balances.ts`
- `lib/settlements.ts`
- `pages/Dashboard.tsx`
- `components/BalanceBar.tsx`
- Commit: `feat: dashboard and balances`

### Step 8 — Settle up
- `pages/SettleUp.tsx`
- `components/SettlementItem.tsx`
- Mark as settled inserts to `settlements`, refreshes balances
- Commit: `feat: settle up`

### Step 9 — Realtime
- `hooks/useRealtime.ts`
- Mount in root layout after auth
- Test: open two browser tabs, add expense in one, confirm it appears in the other
- Commit: `feat: realtime sync`

### Step 10 — Receipt scanning
- `lib/vision.ts` — Vision API call and response parsing
- `components/ReceiptScanner.tsx` — file input, loading state, review list
- Wire into `AddExpense.tsx`
- Commit: `feat: receipt scanning`

### Step 11 — Settings
- `pages/Settings.tsx`
- Edit household name, copy invite code, edit display name, sign out
- Commit: `feat: settings`

### Step 12 — Polish
- Loading states on all async operations
- Error handling with user-facing messages
- Empty states (no expenses, no members)
- Mobile-responsive layout (Tailwind breakpoints)
- Commit: `chore: polish and responsive layout`

---

## Prompts for Claude Code

Use these in order, one step at a time.

```
Step 1: Scaffold the monorepo. Init the root package.json with npm workspaces
covering apps/* and packages/*. Scaffold apps/web with Vite + React + TypeScript
+ Tailwind CSS + React Router v6 + Zustand following the folder structure in
CLAUDE.md. Create stub apps/mobile/.gitkeep and packages/shared as described.
Confirm npm run dev from root starts the web dev server.
```

```
Step 2: Set up Supabase. Create lib/supabase.ts using @supabase/supabase-js and
the env vars in CLAUDE.md. Do not run any SQL — output the exact schema SQL and
RLS SQL from CLAUDE.md as two separate code blocks for me to paste into the
Supabase SQL editor.
```

```
Step 3: Build auth. Create store/authStore.ts, hooks/useAuth.ts, pages/Login.tsx,
and pages/Register.tsx. Add a protected route wrapper in router.tsx. Session must
persist on page refresh. Use the Supabase client from lib/supabase.ts.
```

```
Step 4: Build household setup. Create store/householdStore.ts, hooks/useHousehold.ts,
and pages/HouseholdSetup.tsx with create and join flows as described in CLAUDE.md.
Add redirect logic: new user goes to /household-setup, existing member goes to /dashboard.
```

```
Step 5: Build the expenses list. Create store/expenseStore.ts, hooks/useExpenses.ts,
pages/Expenses.tsx, and components/ExpenseCard.tsx. Fetch expenses with their splits
from Supabase in a single query.
```

```
Step 6: Build the add expense page. Create pages/AddExpense.tsx and
components/SplitSelector.tsx. Support all three split modes: equal_all,
equal_selected, and custom. Custom mode must validate splits sum to total before
enabling submit. Insert to expenses then expense_splits on submit. Use cents
for all amounts as described in CLAUDE.md.
```

```
Step 7: Build balances and the dashboard. Create lib/balances.ts and
lib/settlements.ts using the algorithms in CLAUDE.md. Build pages/Dashboard.tsx
and components/BalanceBar.tsx showing net balances, monthly total, and recent expenses.
```

```
Step 8: Build settle up. Create pages/SettleUp.tsx and components/SettlementItem.tsx.
Run the settlements algorithm over current balances. Mark as settled inserts to
the settlements table and refreshes balances.
```

```
Step 9: Add realtime. Create hooks/useRealtime.ts subscribing to the expenses and
settlements tables filtered by household_id as shown in CLAUDE.md. Mount it in the
root layout after auth. Clean up the channel on unmount.
```

```
Step 10: Add receipt scanning. Create lib/vision.ts calling the Google Cloud Vision
TEXT_DETECTION endpoint as described in CLAUDE.md. Create components/ReceiptScanner.tsx
with file input, loading state, and a review list of extracted items. Wire it into
AddExpense.tsx as an optional pre-fill step.
```

```
Step 11: Build the settings page. Create pages/Settings.tsx with edit household name,
copy invite code to clipboard, edit own display name, and sign out.
```

```
Step 12: Polish. Add loading states to all async operations, error handling with
user-facing messages, empty states, and a mobile-responsive layout using Tailwind
breakpoints.
```

---

## Design System

### Aesthetic Direction

Premium, warm minimalism. The feeling is closer to a well-designed personal finance tool or a boutique travel app than a typical fintech product. Generous whitespace, restrained colour, and confident typography do the heavy lifting. No gradients, no shadows that shout, no decorative flourishes. Every element earns its place.

Reference: the first two uploaded screenshots — warm off-white backgrounds, clean card surfaces, large serif numbers, subtle stacked avatar groups, arrow-link navigation. That is the target register.

---

### Fonts

Load all four from Google Fonts.

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / hero numbers | Cormorant Garamond | 300–400 | Large balance amounts, page titles |
| Section headings | Playfair Display | 400–600 | H1, H2, modal titles |
| Body serif | Libre Baskerville | 400 | Expense descriptions, names, labels |
| UI / data | Inter | 300–500 | Amounts in lists, timestamps, buttons, form inputs, nav |

**Rule:** serif fonts carry meaning and identity (names, titles, big numbers). Inter handles everything functional (inputs, buttons, metadata, navigation). Never use Cormorant Garamond below 18px.

---

### Colour Palette

```css
:root {
  /* Backgrounds */
  --color-bg:           #F5F2ED;   /* warm off-white — page background */
  --color-surface:      #FAFAF8;   /* card and modal surfaces */
  --color-surface-alt:  #EFEDE8;   /* subtle inset, input backgrounds */

  /* Text */
  --color-text-primary:   #1A1A18;  /* near-black — headings, primary labels */
  --color-text-secondary: #6B6860;  /* warm mid-grey — metadata, subtitles */
  --color-text-muted:     #A8A49C;  /* light grey — placeholder, disabled */

  /* Accent */
  --color-accent:       #C8513A;   /* warm terracotta red — owed/negative amounts, CTAs */
  --color-accent-green: #3A7D5C;   /* muted forest green — positive/credit amounts */

  /* Borders */
  --color-border:       #E4E1DA;   /* subtle warm divider */
  --color-border-strong:#C9C5BC;   /* card outlines, input focus rings */

  /* Interactive */
  --color-btn-primary:  #1A1A18;   /* near-black pill button */
  --color-btn-text:     #FAFAF8;   /* button label */
}
```

**Rules:**
- Background is always `--color-bg`, never pure white
- Cards sit on `--color-surface` with a 1px `--color-border` border and `border-radius: 16px`
- Positive amounts (you are owed) use `--color-accent-green`
- Negative amounts (you owe) use `--color-accent`
- The only filled/dark button is the primary CTA (e.g. "Create group", "Add expense") — everything else is ghost or text
- No box shadows except a single `0 1px 3px rgba(0,0,0,0.06)` on cards

---

### Spacing & Layout

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;

  --radius-sm:  8px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-pill: 999px;

  --max-width: 480px;   /* web app max content width — centred, mobile-first */
}
```

Page padding: `24px` horizontal on mobile, `32px` on desktop.
Section labels (e.g. "ACTIVE GROUPS", "TRANSACTIONS"): `Inter 500`, `11px`, `letter-spacing: 0.1em`, `text-transform: uppercase`, `--color-text-muted`.

---

### Component Patterns

#### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
```

#### Balance Cards (the two side-by-side summary tiles)

- Two equal-width cards in a row
- Label: `Inter 500 11px uppercase letter-spaced`, `--color-text-muted`
- Amount: `Cormorant Garamond 300`, very large (48–56px), `--color-text-primary`
- Currency suffix: `Inter 400 16px`, `--color-text-secondary`, baseline-aligned with amount
- Stacked member avatars bottom-left (overlap by 8px, 28px diameter circles)
- Arrow icon bottom-right: `--color-accent` or `--color-accent-green` matching the card type

#### Transaction / Expense Rows

```
[emoji icon 36px]  [description Libre Baskerville 15px]     [total amount Inter 500 15px]
                   [paid by Inter 400 13px muted]           [your share Inter 400 13px accent]
```

- No card border on individual rows — use a subtle `border-bottom: 1px solid --color-border` divider
- Group rows inside a single card with no outer padding between them
- Emoji category icons sit in a 36×36 circle with `--color-surface-alt` background

#### List Items with Arrow (groups, settings rows)

```
[icon 40px circle]  [title Playfair Display 400 16px]      [chevron --color-text-muted]
                    [subtitle Inter 400 13px muted]
```

#### Primary Button

```css
.btn-primary {
  background: var(--color-btn-primary);
  color: var(--color-btn-text);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.01em;
  border-radius: var(--radius-pill);
  padding: 16px 32px;
  width: 100%;
  border: none;
  cursor: pointer;
}
```

#### Form Inputs

```css
.input {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: var(--color-text-primary);
  padding: 12px 16px;
}

.input:focus {
  border-color: var(--color-border-strong);
  outline: none;
}
```

Labels: `Inter 500 11px uppercase letter-spaced`, `--color-text-muted`, 8px above input.

#### Navigation (bottom bar on mobile, sidebar on desktop)

- 5 icons: Home, Stats, Add (centre, larger), Groups, Profile
- Active state: filled icon + dot indicator below, `--color-text-primary`
- Inactive: `--color-text-muted`
- Add button: 48px circle, `--color-btn-primary` background, white `+` icon

#### Modal / Sheet

- Slides up from bottom on mobile
- Drag handle: 4×36px rounded bar, `--color-border-strong`, centred at top
- Title: `Playfair Display 400 20px`, centred
- Close button: `×` in a 32px circle with `--color-surface-alt` background, top-right

---

### Typography Scale

```css
/* Display — big balance numbers */
.text-display {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 300;
  font-size: 52px;
  line-height: 1;
  letter-spacing: -0.01em;
}

/* Page title */
.text-title {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 28px;
  line-height: 1.2;
}

/* Section heading / modal title */
.text-heading {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 20px;
  line-height: 1.3;
}

/* Body / expense names */
.text-body {
  font-family: 'Libre Baskerville', serif;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
}

/* UI labels, amounts in lists, buttons */
.text-ui {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.4;
}

/* Section labels */
.text-label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
```

---

### Tailwind Config

Add this to `tailwind.config.ts` to wire the design system into Tailwind classes:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display:  ['"Cormorant Garamond"', 'serif'],
        heading:  ['"Playfair Display"', 'serif'],
        body:     ['"Libre Baskerville"', 'serif'],
        ui:       ['Inter', 'sans-serif'],
      },
      colors: {
        bg:             '#F5F2ED',
        surface:        '#FAFAF8',
        'surface-alt':  '#EFEDE8',
        border:         '#E4E1DA',
        'border-strong':'#C9C5BC',
        text: {
          primary:   '#1A1A18',
          secondary: '#6B6860',
          muted:     '#A8A49C',
        },
        accent:  '#C8513A',
        positive:'#3A7D5C',
        btn:     '#1A1A18',
      },
      borderRadius: {
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        pill: '999px',
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
} satisfies Config
```

---

### Page-by-Page Design Notes

**Login / Register**
Centred single-column layout. App name in Playfair Display at top. Form fields with Inter labels. Primary CTA button full-width at bottom. No illustration or hero image — let the typography breathe.

**Dashboard**
Warm greeting: "Welcome, [name]" in Playfair Display 28px. Two balance cards side by side. "ACTIVE GROUPS" section label then group list card. "TRANSACTIONS" section label then expense rows card. Generous vertical spacing (32px) between sections.

**Household Setup**
Sheet-style modal over a blurred/dimmed background. Drag handle at top. Form fields for name and invite code. Primary CTA at bottom with a muted helper line below it ("All participants will receive an invite").

**Add Expense**
Full page, not a modal. Large amount input at top — Cormorant Garamond 48px, centred, with a CAD prefix in Inter. Description field below. Category picker as a horizontal scrollable row of pill chips. Paid-by and split selector below. Receipt scan as a secondary text link, not a prominent button.

**Settle Up**
Each settlement card: debtor avatar → arrow → creditor avatar, amount in Cormorant Garamond, "Mark as settled" as a small ghost button. Settled items move to a greyed-out history section below.

**Settings**
Plain list rows with section groupings. No cards, just `border-bottom` dividers. Destructive "Sign out" row at the bottom in `--color-accent`.

---

## Out of Scope for Web v1

The following are planned for later versions and should not be built now:

- React Native mobile app (`apps/mobile`)
- Shared business logic package (`packages/shared`) — logic lives in `apps/web/src/lib` for now
- Push notifications
- Multiple households per user
- Multi-currency support
- Recurring expenses
- In-app payments (settle up is manual record-keeping only)