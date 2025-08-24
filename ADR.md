### Architectural Decision Record (ADR)

#### Title
Team Scheduler Standalone – Architecture and Decisions

#### Status
Accepted – 2025-08-24

#### Context
- This is a standalone Next.js App Router application located at `cal.com/team-scheduler-standalone` inside the Cal.com monorepo.
- The goal is a minimal, embeddable team scheduler that authenticates with Google (via Supabase), reads calendars, and books meetings.
- UI must consistently follow shadcn/ui look-and-feel (dark-first), with Lucide icons.
- Deployed on Vercel; Supabase hosts auth and data. The app must work when embedded in other sites.

#### Decision
1) Design system: shadcn/ui tokens + Lucide icons
- Adopt shadcn-style OKLCH CSS variables to theme the entire UI (dark mode default).
- Centralized tokens in `app/globals.css`; Tailwind dark mode is class-based.
- All icons are Lucide, consumed exclusively via an app `Icon` wrapper (`components/ui/Icon.tsx`) to standardize usage and colors.
- Core primitives standardized:
  - `components/ui/Button.tsx`: shadcn-style with `cva` variants, `asChild`, and `loading`.
  - `components/ui/Card.tsx`: shadcn-style card with token-based background/foreground/border.

2) Theming
- Default theme is dark (`<html class="dark">`).
- `ThemeToggle` (client) persists preference in `localStorage` and toggles the `dark` class on `document.documentElement`.
- All colors reference tokens: `--background`, `--foreground`, `--card`, `--muted-foreground`, `--primary`, etc.

3) Icon/color enforcement
- ESLint rules (project-level) and code review enforce using the `Icon` wrapper and token-based classes.
- No direct `lucide-react` imports in application code except inside `Icon.tsx`.

4) AuthN/AuthZ and data
- Supabase is the identity provider and database. Client SDK for browser; SSR client for API routes via `@supabase/ssr`.
- Google OAuth is configured through Supabase. After callback, we upsert the user row to ensure immediate availability server-side.
- First-time users can bootstrap team members from Google Calendar by scanning recent events and extracting attendees with the same company domain.

5) Embedding & CSP
- The app is designed to be embeddable: `frame-ancestors *` is allowed.
- Content Security Policy is set via `next.config.js` headers to support Google OAuth and Supabase while staying restrictive elsewhere. Google script/frame hosts are explicitly allowed.

6) Layout & UX
- The tool intentionally uses a compact width (sign-in and main tool constrained to `max-w-md`), matching the initial “tool card” footprint.
- Navigation is minimal; primary flow is selecting teammates, finding times, and booking.

#### Details
- Framework: Next.js 14 App Router
- Styling: Tailwind CSS (dark mode: `class`), shadcn-style OKLCH tokens in `app/globals.css`
- Icons: Lucide via `components/ui/Icon.tsx`
- UI primitives:
  - `components/ui/Button.tsx` (cva variants: default, secondary, success, danger, outline, ghost)
  - `components/ui/Card.tsx`
- Auth/session:
  - Client: `lib/supabase.ts`
  - Server (API): `lib/supabase-server.ts` with cookie bridging via `@supabase/ssr`
  - Middleware: `middleware.ts` calls `updateSession` to propagate auth cookies
  - Callback: `app/api/auth/callback/route.ts` upserts user
- API routes:
  - `app/api/team-members` – returns teammates for the user (falls back to bootstrap once if session is missing)
  - `app/api/bootstrap-team` – scans recent calendar events and upserts teammates by domain
  - `app/api/availability` – computes common free slots (business hours)
  - `app/api/book-meeting` – books Google Calendar event for selected participants
  - `app/api/meetings` – lists meetings
- CSP (in `next.config.js`):
  - Allows scripts/frames/requests to `accounts.google.com`, `*.google.com`, `*.gstatic.com`, `*.googleusercontent.com`, Supabase host, and self.
  - Keeps `frame-ancestors *` to permit embedding; adjust as needed for stricter embedding control.

#### Environment
- Required env vars (Vercel + local):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `COMPANY_DOMAIN` (e.g., `fvtura.com`)
  - Recommended: `NEXT_PUBLIC_APP_URL` (public base URL)
- Supabase Auth settings:
  - Redirect URLs include the app URL and callback: `/api/auth/callback`
  - Google OAuth Redirect URI in Google Cloud points to: `{SUPABASE_PROJECT}.supabase.co/auth/v1/callback`

#### Alternatives considered
- Using Radix UI primitives directly – rejected to meet shadcn aesthetic and consistency requirements.
- Keeping Tailwind gray/blue utility classes – rejected in favor of token-only styling for global theme control.
- Allowing direct `lucide-react` imports – rejected to centralize icon usage via wrapper for future changes (size/color/global props).
- Stricter CSP without Google script allowances – rejected due to OAuth flow requirements.

#### Consequences
Positive:
- Consistent theming and icon usage, easy future theme tweaks via tokens.
- Embeddable by default; dark mode-first UX aligns with requirements.
- Auth is standardized; SSR and client code paths unified via Supabase SSR helpers.

Trade-offs:
- CSP needs to allow Google hosts (and inline attrs) for OAuth; requires careful auditing.
- Embedding with `frame-ancestors *` is flexible but may be too permissive for some deployments; can be restricted per environment.
- Token discipline requires vigilance; linting and code review enforce it.

#### Testing
- Unit tests should cover:
  - `Button` variants (class composition), `Icon` wrapper rendering
  - Auth utilities (mock Supabase)
- Integration tests should cover:
  - Sign-in via Google (mock provider), callback upsert behavior
  - `bootstrap-team` populating teammates by domain
  - Availability computation and booking flow
- Accessibility: ensure color contrast and keyboard focus states (buttons/links) meet WCAG.

#### Migration/Operational Notes
- If you change the public URL or OAuth settings, update:
  - Supabase Redirect URLs
  - `NEXT_PUBLIC_APP_URL`
  - Google OAuth Authorized origins/redirect URI
- To tighten embedding, set a stricter `frame-ancestors` per environment.
- If introducing more shadcn components, keep token usage only; avoid raw Tailwind grays/blues.


