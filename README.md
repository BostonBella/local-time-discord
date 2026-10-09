# Local Time for Discord

A Discord Activity that lets a user choose a timezone and show the current time for that timezone in Discord Rich Presence.

## Repository layout

- `activity/` — the Discord Activity source code and Cloudflare Worker
- `privacy.html` — public Privacy Policy used by Discord
- `terms.html` — public Terms of Service used by Discord
- `index.html` — public landing page for GitHub Pages

## Cloudflare deployment

The Activity is configured to deploy as a Cloudflare Worker with static assets.

In Cloudflare Workers & Pages:

1. Import this GitHub repository.
2. Set the project root directory to `activity`.
3. Build command: `npm run build`
4. Deploy command: `npx wrangler deploy`
5. Add `DISCORD_CLIENT_ID` as a normal environment variable.
6. Add `DISCORD_CLIENT_SECRET` as an encrypted secret.

The Worker serves the built Vite app and handles the Discord OAuth token exchange at `/api/token`.

Do not commit real Discord credentials. `.env` and `.dev.vars` files are ignored by Git.
