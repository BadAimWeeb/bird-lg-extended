"use client";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { SmartRender } from "./SmartRender";

export function CommandStream({ cmd, servers, type }: { cmd: string, servers: string[], type?: "bird" | "traceroute" }) {
    const responses = useRef<Record<string, [number, string]>>({});
    const [_, setCounterUpdate] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setCounterUpdate(c => c + 1);
        }, 1000);

        let stream = new EventSource(`/api/command?cmd=${encodeURIComponent(cmd)}&servers=${encodeURIComponent(servers.join(','))}&type=${type || "bird"}`);

        stream.onmessage = (event) => {
            const [server, data] = JSON.parse(event.data);
            if (!responses.current[server]) {
                responses.current[server] = [NaN, ""];
            }

            if (typeof data === "number") {
                responses.current[server][0] = data;
            } else {
                responses.current[server][1] += data;
            }
        };

        stream.onerror = (event) => {
            // Finalize the stream
            stream.close();

            clearInterval(interval);
            setCounterUpdate(c => c + 1);

            setIsLoading(false);
        };

        return () => {
            clearInterval(interval);
            // Clear responses
            responses.current = {};
            // Close the stream if it exists

            stream.close();
        };
    }, []);

    return (
        <>
            {isLoading && <LinearProgress />}
            {Object.entries(responses.current).sort(([serverA], [serverB]) => serverA.localeCompare(serverB)).map(([server, [lastUpdated, data]]) => (
                <Box key={server} sx={{ pt: 1.5, pb: 1.5 }}>
                    <Box sx={{ mb: 1 }}>
                        <Tooltip title={`Cached on: ${lastUpdated === Number.MAX_SAFE_INTEGER ? "Live" : new Date(lastUpdated).toLocaleString()}`}>
                            <Typography variant="h6" component="span">
                                {server}: {cmd}
                            </Typography>
                        </Tooltip>
                    </Box>
                    <code style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{isLoading ? data : <SmartRender birdOutput={data} />}</code>
                </Box>
            ))}
        </>
    );
}