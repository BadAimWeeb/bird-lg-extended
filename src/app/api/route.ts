import type { NextRequest } from 'next/server';

import { summaryCache } from "./summary/route";
import { executeBirdCommand, executeTraceroute } from "@/utils_server/execute_bird";
import { getWhoisWithCache } from "./whois/route";

export async function POST(request: NextRequest) {
    try {
        const { servers, type, args } = await request.json() as {
            servers: string[],
            type: "summary" | "bird" | "traceroute" | "whois" | "server_list",
            args: string
        };

        switch (type) {
            case "server_list": {
                return new Response(JSON.stringify({
                    error: "",
                    result: Object.keys(summaryCache).map(k => ({
                        server: k,
                        data: ""
                    }))
                }));
            }

            case "summary": {
                return new Response(JSON.stringify({
                    error: "",
                    result: servers.map(server => ({
                        server,
                        data: summaryCache[server]?.data || []
                    }))
                }));
            }

            case "bird": {
                const requests = Promise.all(servers.map(async server => {
                    try {
                        const birdResponse = await executeBirdCommand(args, server);

                        const data = await birdResponse.text();
                        return { server, data };
                    } catch (e) {
                        return { server, data: `Error: ${String(e)}` };
                    }
                }));

                return new Response(JSON.stringify({
                    error: "",
                    result: await requests
                }));
            }

            case "traceroute": {
                const requests = Promise.all(servers.map(async server => {
                    try {
                        const tracerouteResponse = await executeTraceroute(args, server);

                        const data = await tracerouteResponse.text();
                        return { server, data };
                    } catch (e) {
                        return { server, data: `Error: ${String(e)}` };
                    }
                }));

                return new Response(JSON.stringify({
                    error: "",
                    result: await requests
                }));
            }

            case "whois": {
                return new Response(JSON.stringify({
                    error: "",
                    result: await getWhoisWithCache(args)
                }));
            }

            default:
                throw "Unknown request type";
        }
    } catch (e) {
        return new Response(JSON.stringify({
            error: String(e),
            result: []
        }));
    }
}
