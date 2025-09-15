import { executeBirdCommand } from '@/utils_server/execute_bird';
import SERVERS from '@/utils_server/servers'
import { SERVERS_CLIENT_VIEW } from '@/utils_server/servers';
import type { NextRequest } from 'next/server'

let cache: Record<string, {
    lastChecked: number,
    endpoint: string,
    data?: {
        name: string,
        proto: string,
        table: string,
        state: string,
        since: string,
        info: string
    }[],
    fetching: boolean
}> = Object.fromEntries(Object.entries(SERVERS).map(([key, value]) => [
    value,
    {
        lastChecked: 0,
        endpoint: key,
        fetching: false
    }
]));

export const summaryCache = cache;

setInterval(async () => {
    for (const server in cache) {
        const now = Date.now();
        if (now - cache[server].lastChecked > 2500) {
            if (!cache[server].fetching) {
                cache[server].fetching = true;
                (async () => {
                    try {
                        const birdResponse = await executeBirdCommand('show protocols', cache[server].endpoint);

                        const dataRaw = await birdResponse.text();
                        const dataLines = dataRaw.split('\n').filter(line => line.trim() !== '');

                        const data = dataLines.map(line => {
                            const [name, proto, table, state, since, info] = line.split(/ +/).map(s => s.trim());
                            return { name, proto, table, state, since, info };
                        }).slice(1); // Skip the header line

                        cache[server].lastChecked = now;
                        cache[server].data = data;
                    } catch (error) {
                        console.error(`Error fetching data from ${server}:`, error);
                    } finally {
                        cache[server].fetching = false;
                    }
                })();
            }
        }
    }
}, 2000);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const restrictServers = searchParams.get('servers')?.split(',').map(s => s.trim()) || SERVERS_CLIENT_VIEW;

    let result: Record<string, [lastUpdated: number, data?: {
        name: string,
        proto: string,
        table: string,
        state: string,
        since: string,
        info: string
    }[]]> = {};

    let p: Promise<any>[] = [];
    for (const server of restrictServers) {
        if (!cache[server]) {
            return Response.json({ error: `Server ${server} not found` }, { status: 404 });
        }

        // Always use cached data
        result[server] = [cache[server].lastChecked, cache[server].data || []];
    }

    return Response.json(result);
}
