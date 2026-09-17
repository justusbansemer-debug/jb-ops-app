# J.B. Pressure Washing — Ops App

This is your own private CRM: customers, jobs, quotes, and invoices, built to replace
QuoteIQ. It's a real, working Next.js app connected to a Supabase database.

## What's in here, in plain terms

- **The database (Supabase)** — where every customer, job, quote, and invoice actually
  lives, permanently. Think of it as a set of spreadsheets in the cloud that this app
  reads from and writes to. See `supabase/schema.sql`.
- **The app (this Next.js project)** — the screens you and your team actually look at
  and click around in. Lives in `src/app/` — one folder per screen (`customers/`,
  `jobs/`, `quotes/`, `invoices/`).
- **Hosting (Vercel)** — where the app lives on the internet once it's deployed, at a
  private link only people you invite can reach.

## Running it on your own computer (optional, for testing)

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Without a connected database yet, the pages will load
but show "no data" messages — that's expected until step 2 below is done.

## Step 1: Create your database

1. Go to [supabase.com](https://supabase.com) and sign up free (you can use your Google account).
2. Create a new project — name it something like `jb-pressure-washing`.
3. Once it's ready, click **SQL Editor** in the left sidebar → **New query**.
4. Open `supabase/schema.sql` in this project, copy the whole thing, paste it into the
   query box, and click **Run**. This creates your Customers, Jobs, Quotes, and
   Invoices tables.

## Step 2: Connect the app to your database

1. In Supabase, click the **Connect** button on your project dashboard (easiest), or go to
   **Project Settings** (gear icon) → **API Keys**.
2. Copy the **Project URL**.
3. Copy the **Publishable key** (starts with `sb_publishable_...`) — NOT the **Secret key**,
   that one's private.
4. In this project, copy `.env.local.example` to a new file named `.env.local`, and
   paste your two values in.
5. Restart `npm run dev` if it was running. Your dashboard should now show real (empty)
   numbers instead of the "not connected" message.

## Step 3: Put it online (so you can use it from your phone)

We'll do this together when you're ready — it's a few clicks through Vercel
(vercel.com), which can deploy this project directly and gives you a private link like
`jb-ops.vercel.app`.

## Step 4: Create your login

The app now requires signing in — nobody can see or change your data without an
account, even if they have the link.

1. In Supabase, click **Authentication** in the left sidebar → **Users** → **Add user**
   → **Create new user**.
2. Enter your email and a password. Leave "Auto Confirm User" checked (skips email
   verification since this is just for you).
3. Click **Create user**. That's it — there's no public sign-up page in the app on
   purpose, so the only way in is an account you create yourself in Supabase.
4. If you already ran an older copy of `supabase/schema.sql`, re-run the updated one
   (SQL Editor → New query → paste the whole file → Run). It safely replaces the old
   "anyone can read/write" rule with "only signed-in users can."
5. Go to your app's link and sign in with that email and password.

## What's deliberately simple right now (and what's next)

- One login for you — there's no multi-employee/role system, since it's just you using
  this right now. If that changes later, we can add it then.
- The Customer dropdowns on the Jobs/Quotes/Invoices pages are plain lists — fine for a
  handful of customers, and something we can make searchable later once you have more.
- No editing or deleting yet — only adding new records. Editing existing jobs/invoices
  is a natural next step once the basics feel right.

None of that needs to be fixed before you start using it to see how it feels — it's
meant to grow with you, one piece at a time.
