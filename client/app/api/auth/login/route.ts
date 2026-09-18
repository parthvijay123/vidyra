import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  let url = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000"
  ).trim();

  // Strip accidental wrapping quotes from environment variable inputs
  url = url.replace(/^["']|["']$/g, "").trim();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  return url.replace(/\/+$/, "");
}

const FRONTEND_CALLBACK_PATH = "/callback";
const BACKEND_SESSION_COOKIE_NAME = process.env.BFF_BACKEND_SESSION_COOKIE_NAME || "session";

function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const rawProto = request.headers.get("x-forwarded-proto") || "https";
    const forwardedProto = rawProto.split(",")[0].trim();
    return `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`;
  }
  return request.nextUrl.origin;
}

function getSetCookieValues(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as unknown as { getSetCookie?: () => string[] };
  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }

  const singleSetCookie = headers.get("set-cookie");
  return singleSetCookie ? [singleSetCookie] : [];
}

function getCookieName(setCookieValue: string): string | null {
  const pair = setCookieValue.split(";", 1)[0];
  const index = pair.indexOf("=");
  if (index <= 0) {
    return null;
  }
  return pair.slice(0, index).trim();
}

function appendSelectedSetCookies(
  sourceHeaders: Headers,
  targetHeaders: Headers,
  allowedCookieNames: Set<string>
): void {
  for (const setCookieValue of getSetCookieValues(sourceHeaders)) {
    const cookieName = getCookieName(setCookieValue);
    if (cookieName && allowedCookieNames.has(cookieName)) {
      targetHeaders.append("set-cookie", setCookieValue);
    }
  }
}

export async function GET(request: NextRequest) {
  let origin = "https://client-sooty-ten-65.vercel.app";
  try {
    origin = getRequestOrigin(request);
  } catch {
    origin = request.nextUrl.origin;
  }

  try {
    const backendBase = getBackendUrl();

    // Check if BACKEND_URL was left as localhost on a deployed Vercel instance
    if (backendBase.includes("localhost") && origin.includes("vercel.app")) {
      const msg = "BACKEND_URL environment variable is not configured in Vercel settings. Please set BACKEND_URL to your Render service URL.";
      console.error("[api/auth/login]", msg);
      return NextResponse.redirect(
        new URL(`${FRONTEND_CALLBACK_PATH}?error=${encodeURIComponent(msg)}`, origin),
        { status: 303 }
      );
    }

    const backendLoginUrl = new URL(`${backendBase}/auth/login`);
    backendLoginUrl.searchParams.set("redirect", "true");
    backendLoginUrl.searchParams.set("frontend_redirect", `${origin}${FRONTEND_CALLBACK_PATH}`);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendLoginUrl.toString(), {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("[api/auth/login] Connection to backend failed:", fetchErr);
      const msg = `Unable to reach backend at ${backendBase}. If using Render free tier, the service may be starting up or waking from sleep. Please try again in 30 seconds.`;
      return NextResponse.redirect(
        new URL(`${FRONTEND_CALLBACK_PATH}?error=${encodeURIComponent(msg)}`, origin),
        { status: 303 }
      );
    }

    const location = backendResponse.headers.get("location");
    if (!location) {
      console.error("[api/auth/login] Backend returned status", backendResponse.status, "without location header");
      const msg = `Backend returned status ${backendResponse.status} without redirect URL. Check backend logs.`;
      return NextResponse.redirect(
        new URL(`${FRONTEND_CALLBACK_PATH}?error=${encodeURIComponent(msg)}`, origin),
        { status: 303 }
      );
    }

    // Safely resolve location URL (handles both absolute and relative paths)
    const targetUrl = location.startsWith("http://") || location.startsWith("https://")
      ? location
      : new URL(location, backendBase).toString();

    const response = NextResponse.redirect(targetUrl, { status: 302 });
    appendSelectedSetCookies(
      backendResponse.headers,
      response.headers,
      new Set([BACKEND_SESSION_COOKIE_NAME])
    );
    return response;
  } catch (err) {
    console.error("[api/auth/login] Critical unexpected error:", err);
    return NextResponse.redirect(
      new URL(`${FRONTEND_CALLBACK_PATH}?error=${encodeURIComponent(String(err))}`, origin),
      { status: 303 }
    );
  }
}
