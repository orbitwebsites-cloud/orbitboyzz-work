// x402 bot paywall: humans browse free, AI crawlers/scrapers pay per request.
//
// Built directly on the official x402 v2 libraries (@x402/core + @x402/evm,
// @coinbase/x402 for the CDP facilitator). @x402/next is not used because every
// v2 release requires Next >= 16 and this site is on Next 15; the request/
// settlement flow below mirrors @x402/next's paymentProxy adapter.
import { NextResponse } from "next/server";

export const BOT_UA_PATTERNS = {
  // Checked first: search engines, link unfurlers, platform + uptime bots stay free.
  allow: [
    "googlebot",
    "bingbot",
    "duckduckbot",
    "slurp",
    "twitterbot",
    "facebookexternalhit",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "whatsapp",
    "telegrambot",
    "vercel",
    "uptimerobot",
    "pingdom",
    "statuscake",
    "betteruptime",
    "better stack",
    "site24x7",
    "freshping",
    "hetrixtools",
    "checkly",
    "uptime-kuma",
    "uptime kuma",
  ],
  charge: [
    "gptbot",
    "chatgpt-user",
    "oai-searchbot",
    "claudebot",
    "claude-user",
    "claude-searchbot",
    "anthropic-ai",
    "ccbot",
    "perplexitybot",
    "perplexity-user",
    "bytespider",
    "amazonbot",
    "applebot-extended",
    "google-extended",
    "meta-externalagent",
    "meta-externalfetcher",
    "facebookbot",
    "diffbot",
    "cohere-ai",
    "cohere-training-data-crawler",
    "youbot",
    "ai2bot",
    "ai2bot-dolma",
    "timpibot",
    "imagesiftbot",
    "omgili",
    "petalbot",
    "scrapy",
    "python-requests",
    "aiohttp",
    "go-http-client",
    "curl",
    "wget",
    "headlesschrome",
    "phantomjs",
  ],
};

const DEFAULT_PAY_TO = "0x0ba3b8796ce61ef8Cbd11A7F33Be31F1Fd4A03B3";
const DEFAULT_PRICE = "$0.001";
const DEFAULT_NETWORK = "eip155:8453"; // Base mainnet, USDC
const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";
const FACILITATOR_TIMEOUT_MS = 10_000;

export function isPaywallEnabled() {
  return (process.env.X402_ENABLED ?? "").trim().toLowerCase() !== "false";
}

/** True when the UA should be charged. Allow-list wins (plain Applebot is not in charge list). */
export function isChargeableBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  if (BOT_UA_PATTERNS.allow.some((p) => ua.includes(p))) return false;
  return BOT_UA_PATTERNS.charge.some((p) => ua.includes(p));
}

/** Paths that are always free, even for chargeable bots. */
export function isFreePath(pathname) {
  return (
    pathname === "/robots.txt" ||
    pathname === "/llms.txt" ||
    /^\/sitemap[^/]*\.xml$/i.test(pathname) ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    /\.(?:css|js|mjs|map|json|txt|xml|ico|png|jpe?g|gif|webp|avif|svg|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|pdf)$/i.test(
      pathname,
    )
  );
}

// ---------------------------------------------------------------------------
// Lazily-built x402 resource server (only bots ever pay the import/init cost).

let serverPromise = null;

async function createHttpServer() {
  const [{ x402ResourceServer, x402HTTPResourceServer, HTTPFacilitatorClient }, { ExactEvmScheme }] =
    await Promise.all([import("@x402/core/server"), import("@x402/evm/exact/server")]);

  let facilitatorConfig;
  if (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET) {
    const { createFacilitatorConfig } = await import("@coinbase/x402");
    facilitatorConfig = createFacilitatorConfig(
      process.env.CDP_API_KEY_ID,
      process.env.CDP_API_KEY_SECRET,
    );
  } else {
    facilitatorConfig = { url: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL };
  }

  const network = process.env.X402_NETWORK || DEFAULT_NETWORK;
  const facilitator = new HTTPFacilitatorClient({
    ...facilitatorConfig,
    timeout: FACILITATOR_TIMEOUT_MS,
  });
  const resourceServer = new x402ResourceServer(facilitator).register(
    network,
    new ExactEvmScheme(),
  );

  // A single RouteConfig applies to every path; free paths are filtered before this.
  // `resource` is left unset so it defaults to the request URL.
  const httpServer = new x402HTTPResourceServer(resourceServer, {
    accepts: {
      scheme: "exact",
      price: process.env.X402_PRICE || DEFAULT_PRICE,
      network,
      payTo: process.env.X402_PAY_TO || DEFAULT_PAY_TO,
    },
    description: "Paid access for automated agents",
    mimeType: "text/html",
  });
  await httpServer.initialize();
  return httpServer;
}

function getHttpServer() {
  if (!serverPromise) {
    serverPromise = createHttpServer().catch((err) => {
      serverPromise = null; // allow a retry on the next bot request
      throw err;
    });
  }
  return serverPromise;
}

function createAdapter(req) {
  return {
    getHeader: (name) => req.headers.get(name) || undefined,
    getMethod: () => req.method,
    getPath: () => req.nextUrl.pathname,
    getUrl: () => req.url,
    // Always answer agents with machine-readable JSON, never the browser paywall HTML.
    getAcceptHeader: () => "application/json",
    getUserAgent: () => req.headers.get("user-agent") || "",
    getQueryParams: () => Object.fromEntries(req.nextUrl.searchParams.entries()),
    getQueryParam: (name) => req.nextUrl.searchParams.get(name) ?? undefined,
  };
}

async function paymentRequiredResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/json");
  let body = response.body ?? {};
  // v2 carries requirements in the PAYMENT-REQUIRED header; mirror them in the body as JSON.
  const encoded = headers.get("PAYMENT-REQUIRED");
  if (encoded && (!body || Object.keys(body).length === 0)) {
    try {
      const { decodePaymentRequiredHeader } = await import("@x402/core/http");
      body = decodePaymentRequiredHeader(encoded);
    } catch {
      /* keep header-only response */
    }
  }
  return new NextResponse(JSON.stringify(body), { status: response.status, headers });
}

/**
 * Returns a Response for chargeable bots (402, or a settled pass-through), or
 * null when the request should continue untouched. Never throws (fail open).
 */
export async function handleBotPaywall(req) {
  try {
    if (!isPaywallEnabled()) return null;
    if (isFreePath(req.nextUrl.pathname)) return null;
    if (!isChargeableBot(req.headers.get("user-agent"))) return null;

    const httpServer = await getHttpServer();
    const path = req.nextUrl.pathname;
    let decodedPath = path;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      /* keep raw */
    }
    const adapter = createAdapter(req);
    const context = {
      adapter,
      path,
      decodedPath,
      method: req.method,
      paymentHeader: adapter.getHeader("payment-signature") || adapter.getHeader("x-payment"),
    };

    const result = await httpServer.processHTTPRequest(context);
    if (result.type === "no-payment-required") return null;
    if (result.type === "payment-error") {
      // Facilitator/server errors (5xx) fail open; payment problems return 402.
      if (result.response.status >= 500) return null;
      return paymentRequiredResponse(result.response);
    }

    // payment-verified: settle now, then let Next render the page.
    const settlement = await httpServer.processSettlement(
      result.paymentPayload,
      result.paymentRequirements,
      result.declaredExtensions,
      { request: context, responseBody: Buffer.alloc(0), responseHeaders: {} },
      undefined,
      result.beforeHandlerSettlement,
    );
    if (!settlement.success) {
      const { response } = settlement;
      const body = response.isHtml ? response.body : JSON.stringify(response.body ?? {});
      return new NextResponse(body, { status: response.status, headers: response.headers });
    }
    const res = NextResponse.next();
    for (const [key, value] of Object.entries(settlement.headers)) res.headers.set(key, value);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("[x402-bot-paywall] failing open:", err);
    return null;
  }
}
