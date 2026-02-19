# Bookmark Manager

A full-stack bookmark manager built with Next.js 15, Supabase, and Tailwind CSS.

## Features
- Google OAuth authentication (no email/password)
- Add bookmarks with title + URL
- Private bookmarks per user (Row Level Security)
- Real-time updates across tabs (Supabase Realtime)
- Delete bookmarks
- Deployed on Vercel

## Tech Stack
- **Next.js 15** (App Router)
- **Supabase** (Auth, PostgreSQL, Realtime)
- **Tailwind CSS**

## Setup

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/migration.sql`
3. In **Authentication > Providers**, enable **Google** and add your OAuth credentials
4. In **Authentication > URL Configuration**, add your Vercel URL to "Redirect URLs": `https://your-app.vercel.app/auth/callback`

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project, then go to **APIs & Services > Credentials**
3. Create an OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret into Supabase's Google provider settings

### 3. Local Development
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key from Project Settings > API
npm install
npm run dev
```

### 4. Deploy to Vercel
1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Problems & Solutions

### Problem 1: Cookies in Next.js 15 Server Components
`cookies()` from `next/headers` is now async in Next.js 15. Had to `await cookies()` in the Supabase server client helper.

**Solution:** Updated the server client to `const cookieStore = await cookies()`.

### Problem 2: Realtime only receiving events for the current user
Supabase Realtime needs RLS to be enabled, but also requires the `filter` option in the channel subscription to scope events to the authenticated user.

**Solution:** Added `filter: \`user_id=eq.${userId}\`` to the Realtime channel `.on()` config.

### Problem 3: Middleware redirecting the auth callback
The middleware was redirecting `/auth/callback` to `/login` before the session could be established.

**Solution:** Added `/auth` as an excluded prefix in the middleware matcher so auth routes pass through freely.

### Problem 4: URLs without protocol
Users often type URLs like `example.com` without `https://`, which causes `new URL()` to throw.

**Solution:** Auto-prepend `https://` if the URL doesn't start with `http://` or `https://`.
