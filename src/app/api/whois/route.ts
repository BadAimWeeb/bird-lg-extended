import whois from "whois";
import type { NextRequest } from 'next/server'

let cache: Record<string, Promise<{
    lastCached: number,
    data: string
}> | undefined> = {}

export const whoisCache = cache;

export async function getWhoisWithCache(resource: string) {
    // Check cache
    if (cache[resource]) {
        const cached = await cache[resource];
        if (Date.now() - cached.lastCached < 5 * 60 * 1000) { // 5 minutes
            return cached;
        } else {
            cache[resource] = undefined; // Invalidate cache
        }
    }

    cache[resource] = new Promise<{
        lastCached: number,
        data: string
    }>((resolve, reject) => {
        // Fallback timeout to prevent hanging
        setTimeout(() => {
            reject(new Error('Timeout while fetching WHOIS data'));
        }, 15500);

        whois.lookup(resource, {
            timeout: 15000,
            punycode: true,
            // If not defined, this will look up database for root WHOIS server
            server: process.env.WHOIS_SERVER
        }, (err, d) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    lastCached: Date.now(),
                    data: d as string
                });

                setTimeout(() => {
                    cache[resource] = undefined; // Invalidate cache after 5 minutes
                }, 5 * 60 * 1000);
            }
        });
    }).catch(e => {
        cache[resource] = undefined;
        throw e;  
    });

    return cache[resource];
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const resource = searchParams.get('resource')?.trim();

    if (!resource) {
        return new Response('Missing resource parameter', { status: 400 });
    }

    try {
        return (await getWhoisWithCache(resource)).data;
    } catch (error) {
        return new Response(`Error fetching WHOIS data: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
    }
}
