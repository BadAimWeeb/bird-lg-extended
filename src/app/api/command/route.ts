import { executeBirdCommand } from '@/utils_server/execute_bird';
import { SERVERS_REVERSE } from '@/utils_server/servers'
import type { NextRequest } from 'next/server'

import { EventEmitter } from 'events';
import { SERVERS_CLIENT_VIEW } from '@/utils_server/servers_client_view';

const cache: Map<string, {
    cachedOn: number,
    data: string,
    liveFeed?: EventEmitter
}> = new Map();

// Garbage collection for cache
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.cachedOn > 5500) {
            cache.delete(key);
        }
    }
}, 1000);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const restrictServers = searchParams.get('servers')?.split(',').map(s => s.trim()) || SERVERS_CLIENT_VIEW;
    const cmd = searchParams.get('cmd')?.trim();

    if (restrictServers.length === 0) {
        return Response.json({ error: 'No servers specified' }, { status: 400 });
    }

    if (!cmd) {
        return Response.json({ error: 'No command specified' }, { status: 400 });
    }

    for (const server of restrictServers) {
        if (!SERVERS_REVERSE[server]) {
            return Response.json({ error: `Server ${server} not found` }, { status: 404 });
        }
    }

    let streamController: ReadableStreamDefaultController<string> | null = null;
    const stream = new ReadableStream<string>({
        start(controller) {
            streamController = controller;
        }
    });

    const queue: string[] = [];
    function emitData(data: string) {
        if (streamController) {
            if (queue.length > 0) {
                while (queue.length > 0) {
                    const queuedData = queue.shift();
                    streamController.enqueue("data: " + queuedData + "\n\n");
                }
            }
            streamController.enqueue("data: " + data + "\n\n");
        } else {
            queue.push(data);
        }
    }

    const ps: Promise<any>[] = [];
    for (const server of restrictServers) {
        // Check if cache exists and is fresh
        const cached = cache.get(`${server}!@!${cmd}`);
        if (cached && Date.now() - cached.cachedOn < 5000) {
            emitData(JSON.stringify([server, cached.cachedOn]));
            emitData(JSON.stringify([server, cached.data]));

            if (cached.liveFeed) {
                ps.push(new Promise<void>((resolve) => {
                    cached.liveFeed!.on('data', (data: string) => {
                        emitData(JSON.stringify([server, data]));
                    });
                    cached.liveFeed!.on('end', (ts: number) => {
                        emitData(JSON.stringify([server, ts]));
                        resolve();
                    });
                }));
            } else {
                emitData(JSON.stringify([server, cached.cachedOn]));
            }
        } else {
            emitData(JSON.stringify([server, Number.MAX_SAFE_INTEGER]));

            ps.push((async () => {
                let o: {
                    cachedOn: number,
                    data: string,
                    liveFeed?: EventEmitter
                } = {
                    cachedOn: Number.MAX_SAFE_INTEGER,
                    data: '',
                    liveFeed: new EventEmitter()
                };

                cache.set(`${server}!@!${cmd}`, o);

                try {
                    let birdResponse = await executeBirdCommand(cmd, SERVERS_REVERSE[server]);

                    if (!birdResponse.ok) {
                        throw new Error(`Failed to execute command on ${server}`);
                    }

                    const stream = birdResponse.body;
                    if (!stream) {
                        throw new Error(`No response body from ${server}`);
                    }

                    const reader = stream.getReader();

                    let done = false;
                    while (!done) {
                        const { value, done: isDone } = await reader.read();
                        if (isDone) {
                            done = true;
                            o.cachedOn = Date.now();
                            o.liveFeed!.emit('end', o.cachedOn);
                            emitData(JSON.stringify([server, o.cachedOn]));
                            delete o.liveFeed;
                        } else {
                            let d = new TextDecoder().decode(value);

                            o.data += d;
                            emitData(JSON.stringify([server, d]));
                            o.liveFeed!.emit('data', d);
                        }
                    }
                } catch (error) {
                    emitData(JSON.stringify([server, '\nError retrieving data: ' + (error instanceof Error ? error.message : String(error))]));
                    emitData(JSON.stringify([server, Number.MAX_SAFE_INTEGER]));
                    cache.delete(`${server}!@!${cmd}`);
                    return;
                }
            })());
        }
    }

    let keepAlive = setInterval(() => {
        if (streamController) {
            streamController.enqueue(": keep-alive\n\n");
        }
    }, 10000);

    await Promise.allSettled(ps).finally(() => {
        if (streamController) {
            streamController.close();
        }

        clearInterval(keepAlive);
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
