# Cloudflare Turnstile Integration

To enable Turnstile protection on your chat API, you need to add the following environment variables to your `.env` file and your Vercel project settings.

## 1. Get Keys from Cloudflare
1. Go to your Cloudflare Dashboard > Turnstile.
2. Add a new site (Domain: `localhost` for dev, your actual domain for prod).
3. Copy your **Site Key** and **Secret Key**.

## 2. Update .env

Add these lines to your `.env` file:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

## 3. Update Vercel Settings
1. Go to your Vercel Project > Settings > Environment Variables.
2. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Add `TURNSTILE_SECRET_KEY`.
4. Redeploy your project.

> **Note:** Ideally, create separate keys for Development (localhost) and Production.
