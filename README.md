Hotel management system built with Next.js, Supabase, and deployed on Vercel.

## Getting Started

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migration files in order from `src/lib/supabase/migrations/` in the Supabase SQL editor.
3. Copy the project URL and anon key from **Project Settings → API**.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Run the development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### GitHub → Vercel (auto deploy)

1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
3. Add the environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Every push to `main` will trigger an automatic deployment.

### CI

GitHub Actions runs lint and build checks on every push and pull request to `main` (see `.github/workflows/ci.yml`). Add the same Supabase environment variables as repository secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for the build step to succeed.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
