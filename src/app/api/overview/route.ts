import { executeBirdCommand } from '@/utils_server/execute_bird';
import SERVERS from '@/utils_server/servers'
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
    }[]
}> = Object.fromEntries(Object.entries(SERVERS).map(([key, value]) => [
    value,
    {
        lastChecked: 0,
        endpoint: key
    }
]));

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const restrictServers = searchParams.get('restrict')?.split(',').map(s => s.trim()) || Object.values(SERVERS);

    let result: Record<string, [lastUpdated: number, data?: {
        name: string,
        proto: string,
        table: string,
        state: string,
        since: string,
        info: string
    }[]]> = {};

    let p: Promise<void>[] = [];
    for (const server of restrictServers) {
        if (!cache[server]) {
            return Response.json({ error: `Server ${server} not found` }, { status: 404 });
        }

        const now = Date.now();
        if (now - cache[server].lastChecked < 2500) {
            // Use cached data
            result[server] = [cache[server].lastChecked, cache[server].data || []];
            continue;
        }

        p.push((async () => {
            try {
                const birdResponse = await executeBirdCommand('show protocols', cache[server].endpoint);

                const dataRaw = await birdResponse.text();
                const dataLines = dataRaw.split('\n').filter(line => line.trim() !== '');

                const data = dataLines.map(line => {
                    const [name, proto, table, state, since, info] = line.split(/ +/).map(s => s.trim());
                    return { name, proto, table, state, since, info };
                }).slice(1); // Skip the header line

                cache[server].data = data;
                cache[server].lastChecked = now;
                result[server] = [now, data];
            } catch (error) {
                console.error(`Error fetching data from ${server}:`, error);
                
                // Use cached data if available
                if (cache[server].data) {
                    result[server] = [cache[server].lastChecked, cache[server].data];
                } else {
                    result[server] = [0, []]; // No data available
                }
            }
        })());
    }

    await Promise.allSettled(p);

    return Response.json(result);
}
