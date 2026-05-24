# Auth Security + Redirect Setup

This adds:

- Stronger password checking before signup/reset
- Forgot password page
- Reset password page
- Safer Supabase redirect helpers
- Fix for confirmation emails going to localhost

## 1. Supabase Dashboard redirect fix

In Supabase:

```txt
Authentication → URL Configuration
```

Set:

```txt
Site URL:
https://your-real-vercel-url.vercel.app
```

Add Redirect URLs:

```txt
http://localhost:3000/**
http://localhost:5173/**
https://your-real-vercel-url.vercel.app/**
https://your-custom-domain.com/**
```

For production, keep your real Vercel/custom domain. Keep localhost only for development.

If the confirmation email currently sends users to localhost, your Supabase Site URL is probably still set to:

```txt
http://localhost:3000
```

Change it to your deployed URL.

## 2. Frontend env

For Vite:

```env
VITE_PUBLIC_SITE_URL=https://your-real-vercel-url.vercel.app
```

For Create React App:

```env
REACT_APP_PUBLIC_SITE_URL=https://your-real-vercel-url.vercel.app
```

The helper supports both.

## 3. Add routes

If you use React Router:

```jsx
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

Optional pages:

```txt
/auth/confirmed
```

If you do not have an auth confirmed page, redirecting to `/` is also fine.

## 4. Signup redirect

Use the included helper:

```js
import { signUpWithSecurePassword } from "./lib/authApi";

await signUpWithSecurePassword({ email, password });
```

It sends:

```js
options: {
  emailRedirectTo: "https://your-site.com/auth/confirmed"
}
```

## 5. Forgot/reset password flow

Forgot password page calls:

```js
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "https://your-site.com/reset-password"
});
```

Reset password page calls:

```js
supabase.auth.updateUser({ password });
```

## 6. Password policy

The included checker requires:

- At least 10 characters
- Uppercase and lowercase letters
- At least one number
- At least one symbol
- Not a very common weak password
- Does not include the email name
- Avoids obvious repeated characters or sequences

You can make it stricter by changing `MIN_PASSWORD_SCORE` in:

```txt
frontend/src/utils/passwordStrength.js
```
