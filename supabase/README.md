# Supabase Setup

## 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), sign in, and create a new project.

## 2. Run the Migration

In the Supabase dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

## 3. Seed Development Data (Optional)

Run the contents of `supabase/seed.sql` to populate sample orders across all 9 Kanban columns.

## 4. Create Auth Users

In Supabase dashboard → **Authentication** → **Users** → **Add User**:

**Admin account:**
- Email: `admin@laundrybuddy.com`
- Password: your choice

After creating, set the role via SQL Editor:
```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
where email = 'admin@laundrybuddy.com';
```

**Staff account:**
- Email: `staff@laundrybuddy.com`
- Password: your choice

```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "staff"}'
where email = 'staff@laundrybuddy.com';
```

## 5. Get Your API Keys

In Supabase dashboard → **Settings** → **API**:

- Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Copy **anon / public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

## 6. Verify Realtime is Enabled

In Supabase dashboard → **Database** → **Replication** → `supabase_realtime` publication → confirm the `orders` table is toggled **on**.
