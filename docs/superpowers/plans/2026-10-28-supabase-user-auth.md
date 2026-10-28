# Supabase User Auth & Data Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Implement full Supabase User Authentication (Email & Password), user registration/login page, and data isolation by `user_id` across trades, reviews, accounts, journals, and finances.

---

### Task 1: Supabase Client Auth Configuration
- [ ] Update `src/lib/supabase.ts` to enable `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: true` so the Supabase client maintains auth state across page reloads.

### Task 2: Internationalization (i18n) for Auth
- [ ] Add all auth-related strings in `src/lib/translations.ts` for both `en` and `th`:
  - `signIn`, `signUp`, `signOut`, `email`, `password`, `confirmPassword`, `displayName`, `dontHaveAccount`, `alreadyHaveAccount`, `authRequired`, `loginSuccess`, `loginFailed`, `registerSuccess`, `registerFailed`, `passwordsDoNotMatch`, `loggingIn`, `creatingAccount`.

### Task 3: Upgrade AuthContext with Supabase Auth
- [ ] Upgrade `src/context/AuthContext.tsx` to:
  - Track `supabaseUser` and map to app `User` type.
  - Listen to `supabase.auth.onAuthStateChange`.
  - Provide `signIn(email, password)`, `signUp(email, password, displayName)`, `signOut()`.
  - Keep security PIN features alongside cloud user authentication.

### Task 4: User Data Isolation in clientStorage
- [ ] In `src/lib/clientStorage.ts`:
  - In `getTrades()`, `saveTrades()`, filter and save with `user_id`.
  - In `getReviews()`, `saveReviews()`, filter and save with `user_id`.
  - In `getAccounts()`, `saveAccounts()`, filter and save with `user_id`.
  - In `getJournals()`, `saveJournals()`, filter and save with `user_id`.
  - In `getFinances()`, `saveFinances()`, filter and save with `user_id`.
  - Ensure fallback to local storage maintains data per user ID or active session.

### Task 5: Build Login & Register Page (`src/app/login/page.tsx`)
- [ ] Create `src/app/login/page.tsx` with:
  - Clean Glassmorphism design matching theme.
  - Tab switcher between "Sign In" and "Create Account".
  - Form validation (passwords match, email format, minimum 6 characters).
  - Feedback alerts for success/failure.
  - Automatic redirect to `/` or previous page upon successful login.

### Task 6: Update Sidebar and Route Protection
- [ ] In `src/components/Sidebar.tsx`:
  - Display logged-in user profile with avatar and email.
  - Add "Sign Out" button with confirmation.
  - If guest/unauthenticated, show "Sign In" button linking to `/login`.
- [ ] In `src/app/layout.tsx` / AuthGuard:
  - Check auth state; if unauthenticated, prompt or redirect to `/login`.

### Task 7: Build Verification & Deployment
- [ ] Run `npm run build` to verify 0 TypeScript and Next.js build errors.
- [ ] Commit changes with descriptive git commit message and push to GitHub.
- [ ] Deploy to Vercel production with `vercel --prod --yes`.
