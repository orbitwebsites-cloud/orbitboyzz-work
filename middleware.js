import { NextResponse } from "next/server";
import { handleBotPaywall } from "./lib/x402-bot-paywall";

export async function middleware(req) {
  const paywallResponse = await handleBotPaywall(req);
  return paywallResponse ?? NextResponse.next();
}

export const config = {
  // Node runtime: the x402 / CDP libraries rely on Node APIs (Buffer, crypto).
  runtime: "nodejs",
  // Skip static assets and always-free files entirely (zero overhead there).
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon|robots\\.txt|sitemap.*\\.xml|llms\\.txt|\\.well-known/).*)",
  ],
};
