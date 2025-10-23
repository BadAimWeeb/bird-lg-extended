import { executeBirdCommand, executeTraceroute } from '@/utils_server/execute_bird';
import { SERVERS_REVERSE } from '@/utils_server/servers'
import type { NextRequest } from 'next/server'

import { EventEmitter } from 'events';
import { SERVERS_CLIENT_VIEW } from '@/utils_server/servers';

const USE_UNSTABLE_SERVER_IDENTIFIER = process.env.USE_SERVER_INDEX_AS_IDENTIFIER === "true";

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
    const restrictServers = (USE_UNSTABLE_SERVER_IDENTIFIER ? 
        (() => {
            if (searchParams.has('servers')) {
                const bi = BigInt(searchParams.get('servers')!);
                const serverList: string[] = [];
                SERVERS_CLIENT_VIEW.forEach((server, index) => {
                    if ((bi & (BigInt(1) << BigInt(index))) !== BigInt(0)) {
                        serverList.push(server);
                    }
                });
                return serverList;
            } else {
                return null;
            }
        })() : 
        searchParams.get('servers')?.split(',').map(s => s.trim())) || SERVERS_CLIENT_VIEW;
    const cmd = searchParams.get('cmd')?.trim();
    const type = searchParams.get('type')?.trim() || 'bird';

    if (restrictServers.length === 0) {
        return Response.json({ error: 'No servers specified' }, { status: 400 });
    }

    if (!cmd) {
        return Response.json({ error: 'No command specified' }, { status: 400 });
    }

    if (type !== 'bird' && type !== 'traceroute') {
        return Response.json({ error: 'Invalid type specified' }, { status: 400 });
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
        const cached = cache.get(`${server}!@!${type}!@!${cmd}`);
        if (cached && Date.now() - cached.cachedOn < 5000) {
            emitData(JSON.stringify([server, cached.cachedOn]));
            emitData(JSON.stringify([server, cached.data]));

            if (cached.liveFeed) {
                ps.push(new Promise<void>((resolve) => {
                    function generateTimeout() {
                        return setTimeout(() => {
                            emitData(JSON.stringify([server, '\nError retrieving data: Stream read timeout']));
                            cached!.liveFeed!.removeAllListeners();
                            cache.delete(`${server}!@!${cmd}`);
                            resolve();
                        }, 15000);
                    }

                    let timeout: ReturnType<typeof setTimeout> = generateTimeout();

                    cached.liveFeed!.on('data', (data: string) => {
                        clearTimeout(timeout);
                        timeout = generateTimeout();
                        emitData(JSON.stringify([server, data]));
                    });

                    cached.liveFeed!.on('end', (ts: number) => {
                        emitData(JSON.stringify([server, ts]));
                        clearTimeout(timeout);
                        resolve();
                    });
                }));
            } else {
                emitData(JSON.stringify([server, cached.cachedOn]));
            }
        } else {
            emitData(JSON.stringify([server, Number.MAX_SAFE_INTEGER]));

            let o: {
                cachedOn: number,
                data: string,
                liveFeed?: EventEmitter
            } = {
                cachedOn: Number.MAX_SAFE_INTEGER,
                data: '',
                liveFeed: new EventEmitter()
            };

            cache.set(`${server}!@!${type}!@!${cmd}`, o);

            ps.push((async () => {
                try {
                    let dataResponse = type === "bird" ? await executeBirdCommand(cmd, SERVERS_REVERSE[server]) : await executeTraceroute(cmd, SERVERS_REVERSE[server]);

                    if (!dataResponse.ok) {
                        throw new Error(`Failed to execute command on ${server}`);
                    }

                    const stream = dataResponse.body;
                    if (!stream) {
                        throw new Error(`No response body from ${server}`);
                    }

                    const reader = stream.getReader();

                    let done = false;
                    while (!done) {
                        const { value, done: isDone } = await Promise.race([
                            reader.read(),
                            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Stream read timeout')), 15000))
                        ]).catch(e => {
                            reader.cancel();
                            throw e;
                        });
                        if (isDone) {
                            done = true;
                            o.cachedOn = Date.now();
                            o.liveFeed!.emit('end', o.cachedOn);
                            emitData(JSON.stringify([server, o.cachedOn]));
                            o.liveFeed!.removeAllListeners();
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
                    o.liveFeed!.emit('data', '\nError retrieving data: ' + (error instanceof Error ? error.message : String(error)));
                    o.liveFeed!.emit('end', Number.MAX_SAFE_INTEGER);
                    console.error("Error retrieving data:", error);
                    o.liveFeed!.removeAllListeners();
                    cache.delete(`${server}!@!${cmd}`);
                    return;
                }
            })());
        }
    }

    let keepAlive = setInterval(() => {
        if (streamController) {
            try {
                streamController.enqueue(": keep-alive\n\n");
                console.log(ps);
            } catch (error) {
                console.error("Error enqueuing keep-alive:", error);
                clearInterval(keepAlive);
            }
        }
    }, 10000);

    Promise.allSettled(ps).finally(() => {
        if (streamController) {
            streamController.close();
        }

        clearInterval(keepAlive);
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'max-age=5',
            'Connection': 'keep-alive'
        }
    });
}
