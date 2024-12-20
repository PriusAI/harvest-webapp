import {
  redirectUri,
  clientId,
  clientSecret,
  API_NICE_URL,
  redirectUrl,
} from "@/lib/constant";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// encode in base 64
const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorMsg = searchParams.get("error");
  const url = req.nextUrl.clone();

  if (errorMsg) {
    url.pathname = "/user/accounts";
    return NextResponse.redirect(url);
  }

  if (!code || !state || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: "Invalid code" },
      { status: 401 }
    );
  }

  url.pathname = "/databases/select";
  try {
    const s = decodeURIComponent(state);
    const decode = JSON.parse(Buffer.from(s, "base64").toString("utf8"));

    const data: any = {
      code,
      redirect_uri: redirectUrl,
      grant_type: "authorization_code",
    };

    if (decode.unionid) {
      data.unionid = decode.unionid;
    }

    console.log(
      `[${req.method}]/v1/oauth/token`,
      JSON.stringify(data, null, 2)
    );

    const notion_auth_resp = await fetch(`${API_NICE_URL}/v1/oauth/token`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
    });

    const notion_auth_resp_json: any = await notion_auth_resp.json();

    if (!notion_auth_resp_json.access_token) {
      url.searchParams.append("error", "access_token not found");
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(url);
  } catch (error: any) {
    url.searchParams.append("error", error.message || "Notion auth failed");
    return NextResponse.redirect(url);
  }
}
