# ForgeNotes settings/contact/password update

This replacement adds:

- `FN` brand icon on the home page instead of `R`.
- A footer with normal website links: Home, Contact, Reset password, Settings.
- `/contact` public contact/help page.
- `/settings` account/settings page for logged-in users.
- Safer password reset flow:
  - `/forgot-password` sends the Supabase recovery email.
  - `/reset-password` is only for choosing a new password.
  - The reset page does not open the normal account dashboard.

## Supabase redirect settings to check

In Supabase Authentication URL settings, add your deployed site URL and these redirects:

- `https://your-site.vercel.app/auth/confirmed`
- `https://your-site.vercel.app/reset-password`
- `http://localhost:3000/auth/confirmed`
- `http://localhost:3000/reset-password`

Also make sure `REACT_APP_PUBLIC_SITE_URL` in Vercel matches your live website URL.
