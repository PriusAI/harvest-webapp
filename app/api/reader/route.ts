import { notifyException } from "@/lib/notify";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const body: any = await req.json();
    const authorization = req.headers.get('authorization')
    if (!body.page_url) {
        return NextResponse.json({ ok: false, message: "page_url is required." });
    }
    if (!authorization) {
        return NextResponse.json({ ok: false, message: "authorization is required." });
    }
    const page_url = decodeURIComponent(body.page_url);
    try {
        let page_html = '';
        let retryCount = 1;
        let lastError: Error | null = null;

        while (retryCount <= 3) {
            try {
                page_html = await getWebPage(page_url);

                if (page_html) {
                    break;
                }
            } catch (error: any) {
                retryCount++;
                lastError = error;
                await wait(retryCount * 800)
            }
        }

        if (page_html) {
            const response = await fetch('http://harvest-api.notion-nice.com/v1/save_page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorization
                },
                body: JSON.stringify({ async_save: true, page_url, page_html })
            })

            const data = await response.json();
            return NextResponse.json({ ok: true, data });
        } else {
            return NextResponse.json({ ok: false, message: lastError?.message || 'page is empty.' });
        }
    } catch (error: any) {
        error.data = JSON.stringify({ url: '/api/reader', body: { page_url } }, null, 2);
        await notifyException(error).catch(console.error);
        return NextResponse.json({ ok: false, message: error.message || 'unknown' });
    }
}


async function getWebPage(page_url: string) {
    const response = await fetch(`https://r.jina.ai/${page_url}`, {
        method: "GET",
        headers: {
            "X-Respond-With": "html",
            "X-Wait-For-Selector": "#js_article"
        },
    });

    const page_html = await response.text();

    return throwWebPage(page_html);
}

function throwWebPage(page_html: string) {
    if (page_html) {
        if (page_html.search("Refreshing too often") > -1) {
            throw new Error("Weixin verification is required.");
        }
        if (
            page_html.search("<title></title>") > -1 ||
            page_html.search("<title>Weixin Official Accounts Platform</title>") > -1
        ) {
            throw new Error("Weixin page is not fully loaded.");
        }
    }

    return page_html;
}

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}