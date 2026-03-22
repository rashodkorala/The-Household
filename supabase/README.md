# Supabase Database Setup

Run these migrations in order in the **Supabase SQL Editor**.

## Migrations

| File | Description |
|---|---|
| `migrations/001_schema.sql` | Creates all tables: households, members, expenses, expense_splits, settlements |
| `migrations/002_rls.sql` | Enables Row Level Security and creates access policies |

## Steps

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste and run `migrations/001_schema.sql`
4. Paste and run `migrations/002_rls.sql`
