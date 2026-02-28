# GANDIA — Team Guide & Architecture Overview

Purpose: this document helps new team members understand the project architecture, key components, recent work, developer setup, and next steps to continue development.

---

## 1. Project at a glance
- Framework: React + TypeScript (Vite project)  
- Styling: Tailwind CSS  
- Build: `tsc -b` + `vite build`  
- Repo root contains main app under `src/`

Key recent additions:
- `src/lib/authSimulator.ts`: in-memory auth simulator (SHA-256 hashing, 2FA token generation, attempts & lockout) used for demo registration/login.
- Chat-driven flows integrated into `src/pages/Login/Login.tsx` and `src/pages/SignUp/SignUp.tsx` to collect email/password/2FA in a conversational UI.

Files to inspect first:
- [src/pages/Login/Login.tsx](../src/pages/Login/Login.tsx) — login UI + chat-like email login flow.
- [src/pages/SignUp/SignUp.tsx](../src/pages/SignUp/SignUp.tsx) — signup UI and the integrated email mini-chat for registration.
- [src/lib/authSimulator.ts](../src/lib/authSimulator.ts) — demo auth module (replace with backend calls in production).

---

## 2. Folder structure (important parts)

```
src/
├── main.tsx                    # App bootstrap and root rendering
├── app/                        # Top-level app wrapper and Router
├── layout/                     # Layout components
│   ├── AppLayout.tsx
│   └── PublicLayout.tsx
├── pages/                      # Route pages
│   ├── Login/
│   │   └── Login.tsx          # Login page (chat + OAuth)
│   ├── SignUp/
│   │   └── SignUp.tsx         # Signup page (chat-driven onboarding)
│   ├── Chat/
│   │   └── Chat.tsx           # Main app chat area (post-login)
│   ├── Home/
│   ├── Historial/
│   ├── Notificaciones/
│   └── ...
├── components/
│   └── ui/                     # Reusable UI primitives
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/                        # Utilities and helpers
│   └── authSimulator.ts       # Demo auth module
├── assets/                     # Static assets
└── styles/
    ├── index.css
    └── globals.css
```

Note: the project uses single-file components for major pages and small UI components in `components/ui`.

---

## 3. Architecture overview

- **Client-only React SPA** built to be easily wired to an API later.
- **UI pattern**: pages hold conversation state (messages array, input state) and render message bubbles + interactive controls.
- **Auth flow (current demo)**:
  - `authSimulator` emulates backend: `registerUser`, `authenticate`, `resend2FA`, `verify2FA`.
  - Login/SignUp use chat steps: `email -> password -> 2FA` before moving to main app.

### Design notes:
- Keep UI logic in pages; consider extracting heavy logic into hooks (e.g., `useAuthFlow`) if flows become complex.
- Replace `authSimulator` with real API calls once backend endpoints exist; adapter functions should be small and centralized (e.g., `src/lib/authApi.ts`).

---

## 4. What we implemented (recap)

### SignUp flow
- Fixed TypeScript/Tailwind issues.
- Integrated email mini-chat: when user clicks "Continuar con Email", a chat-based flow asks for:
  1. Email (validate format + check if exists)
  2. Password (minimum 8 chars)
  3. 2FA code (6 digits sent to "email")
- After 2FA verification, user proceeds to personal onboarding (name, phone, role selection, institutional details).

### Login flow
- Chat-based email login with:
  1. Email validation + account existence check
  2. Password verification via `authSimulator.authenticate()`
  3. 2FA code input/resend support
- Password display is masked in chat bubbles.
- Lockout on 5 failed attempts; timeout is 5 minutes.
- 2FA tokens expire in 5 minutes; resend has a 30-second rate limit.

### Auth Simulator (`authSimulator.ts`)
- **SHA-256 hashing** with random salt for password storage
- **2FA generation**: 6-digit numeric tokens
- **Attempt tracking**: lockout after 5 failed password attempts (5-minute lockout)
- **Resend rate limiting**: 30-second cooldown between resend requests
- **Demo user**: `demo@demo.com` / `Password123!` pre-registered for testing

Developer tip: during the demo flows the 2FA code is printed to the browser console (look for `Demo 2FA token` message).

---

## 5. Developer setup & common commands

### Installation and development:

```bash
npm install
npm run dev
```

This starts the Vite dev server at `http://localhost:5173` (or similar).

### Production build:

```bash
npm run build
```

Outputs optimized bundle to `dist/`.

### TypeScript check only:

```bash
npx tsc -b
```

Useful to debug type errors without full build.

### Key entry points:
- App entry: `src/main.tsx`
- Routes definition: `src/app/Router.tsx`
- Pages: `src/pages/` (Login, SignUp, Chat, Home, etc.)

---

## 6. How to replace the simulator with a real API

### Suggested steps:

1. **Create an adapter module** `src/lib/authApi.ts` that exposes the same function signatures as `authSimulator`:
   ```typescript
   export const registerUser = async (email: string, password: string) => { ... }
   export const authenticate = async (email: string, password: string) => { ... }
   export const verify2FA = (email: string, code: string) => { ... }
   export const resend2FA = (email: string) => { ... }
   ```

2. **Replace imports** in `Login.tsx` and `SignUp.tsx`:
   - Change `import { ... } from '../../lib/authSimulator'`
   - To: `import { ... } from '../../lib/authApi'`

3. **Implement API calls** in `authApi.ts`:
   - Use `fetch` or `axios` to call your backend endpoints.
   - Handle errors gracefully (network errors, validation failures, 429 rate limits, etc.).
   - Store and refresh auth tokens securely (HttpOnly cookies recommended).

4. **Clean up demo artifacts**:
   - Remove console.log statements that print 2FA tokens.
   - Remove the demo user registration.

### Example API contract:

```
POST /api/auth/register
  Request:  { email: string, password: string }
  Response: 201 + { userId: string }

POST /api/auth/authenticate
  Request:  { email: string, password: string }
  Response: 200 + { requires2FA: true } 
            or   { success: false, code: "invalid_password", attemptsLeft: number }

POST /api/auth/2fa/verify
  Request:  { email: string, code: string }
  Response: 200 + { token: string }  // session/JWT token

POST /api/auth/2fa/resend
  Request:  { email: string }
  Response: 200 + { success: true }
```

---

## 7. Coding conventions & notes

- **TypeScript first**: all new code should be TypeScript. Prefer explicit types on props and state.
- **Component structure**: keep reusable, small components in `components/ui/`. Pages can be larger (they're route-specific).
- **Tailwind CSS**: utility-based styling. Avoid arbitrary bracket tokens unless essential. Keep class lists readable.
- **Functional components**: use React hooks (useState, useEffect, useRef, etc.). Avoid class components.
- **File organization**: one major component per file. Small utilities can be grouped in a single file.

---

## 8. Next steps / backlog for integration

Priority:
- [ ] Create `src/lib/authApi.ts` adapter and wire to backend endpoints
- [ ] Add error banner component (currently only message bubbles show errors)
- [ ] Extract auth chat logic into a custom hook `useAuthFlow` for reusability
- [ ] Add unit tests for `authSimulator` and auth flows
- [ ] Implement session token storage and refresh logic
- [ ] Wire the main `/chat` page to real API endpoints for chat functionality

Optional enhancements:
- [ ] Dark/light theme toggle
- [ ] Mobile responsiveness improvements
- [ ] Accessibility (a11y) audit and fixes
- [ ] Email verification (if backend supports it)
- [ ] Social login integration (Google, Apple, Microsoft)

---

## 9. Common issues & debugging

**Issue**: "2FA code not accepting correct input"  
**Debug**: open browser DevTools Console, look for `Demo 2FA token: xxxxxx`. Copy that 6-digit code and paste it.

**Issue**: "Password locked out after a few attempts"  
**Cause**: `authSimulator` locks accounts after 5 failed password attempts for 5 minutes. Reset by closing the browser tab and reopening, or wait 5 minutes.

**Issue**: "TypeScript compilation error"  
**Fix**: run `npx tsc -b` to see full error log. Most common: missing type imports or incorrect prop types.

---

## 10. Questions or contributions?

When adding features:
1. Create a feature branch (e.g., `feature/user-profile`)
2. Update this guide if you change architecture or add major features
3. Test TypeScript: `npx tsc -b`
4. Test build: `npm run build`
5. Open a PR with description of changes

Good luck! 🚀
