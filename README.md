# OrbitBoyzz work portfolio

Next.js site (`npm run dev`, `npm run build`, `npm start`).

## x402 bot paywall

Humans browse free. AI crawlers and scrapers (GPTBot, ClaudeBot, CCBot, curl, python-requests, ...) get
`HTTP 402` with x402 v2 payment requirements ($0.001 USDC on Base per request). Agents that pay via the
`PAYMENT-SIGNATURE` header are verified and settled through the facilitator, then served the page with a
`PAYMENT-RESPONSE` header.

- Logic: `lib/x402-bot-paywall.js` (`BOT_UA_PATTERNS`, free paths, x402 server); wired in `middleware.js` (Node runtime).
- Search engines and link-preview bots (Googlebot, Bingbot, plain Applebot, Slackbot, ...) are never charged.
- Always free: `/robots.txt`, `/sitemap*.xml`, `/favicon*`, `/llms.txt`, `/.well-known/*`, `/_next/*`, `/api/*`, static files.
- Fails open: any error or facilitator outage serves the page normally.
- Config via env, see `.env.example`. `X402_ENABLED=false` turns it off.
- Base mainnet needs `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` (Coinbase CDP facilitator). The default
  `https://x402.org/facilitator` only supports testnets, so without CDP keys the paywall fails open on mainnet.
