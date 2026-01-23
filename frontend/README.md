# Vesting Buddy Frontend

AI-powered employee benefits optimization platform built with Next.js 15, Supabase, and shadcn/ui.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials from [supabase.com](https://supabase.com)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Supabase (SSR with cookie-based sessions)
- **UI**: shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Auth pages (login, signup)
│   ├── dashboard/       # Protected dashboard
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Auth forms and OAuth
│   ├── landing/         # Landing page sections
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── supabase/        # Supabase clients
│   └── validations/     # Zod schemas
└── actions/
    └── auth.ts          # Server actions
```

## Authentication Flow

1. Landing page → Sign up or Login
2. Email/password or Google OAuth
3. Email confirmation (for email/password)
4. Redirect to dashboard

## Features

- ✅ Server-side rendering (SSR)
- ✅ Progressive authentication
- ✅ Type-safe forms with Zod
- ✅ Smooth scroll animations
- ✅ Dark mode support
- ✅ Mobile responsive
