import createMiddleware from "next-intl/middleware";
import {
  defaultLocale,
  localeItems,
  localePrefix,
  locales,
} from "./lib/navigation";
import { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language");
  const userAgent = request.headers.get("user-agent")?.toLowerCase();

  let default_locale: string = "";

  if (userAgent?.includes("weixin")) {
    default_locale = "zh-cn";
  } else {
    default_locale =
      localeItems.find((v) => acceptLanguage?.includes(v.iso))?.code ||
      defaultLocale;
  }

  return createMiddleware({
    locales,
    localePrefix,
    defaultLocale: default_locale,
    localeDetection: false,
  })(request);
};

export const config = {
  // Include all paths that should be internationalized,
  // including the "api" folder, and excluding "_next" folder
  // and all files with an extension (e.g. favicon.ico)
  matcher: ["/((?!_next|.*\\..*|api/.*).*)"],
};

// export const runtime = "experimental-edge";
