import type { NextRequest } from 'next/server'

import { getWhoisWithCache } from "./cache";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const resource = searchParams.get('resource')?.trim();

    if (!resource) {
        return new Response('Missing resource parameter', { status: 400 });
    }

    try {
        return new Response((await getWhoisWithCache(resource)).data);
    } catch (error) {
        return new Response(`Error fetching WHOIS data: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
    }
}
