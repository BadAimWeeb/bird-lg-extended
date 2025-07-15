"use client";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { SmartRender } from "./SmartRender";
import { RouteGraph } from "@/utils_client/Graph";
import { addTargetPoint, graphFromFeed } from "@/utils_client/graphFromBirdFeed";
import * as d3graphviz from "d3-graphviz";

import styles from "./BGPMap.module.css";

export function BGPMap({ cmd, servers, target }: { cmd: string, servers: string[], target: string }) {
    const responses = useRef<Record<string, [number, string]>>({});
    const [counterUpdate, setCounterUpdate] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setCounterUpdate(c => c + 1);
        }, 2000);

        let stream = new EventSource(`/api/command?cmd=${encodeURIComponent(cmd)}&servers=${encodeURIComponent(servers.join(','))}`);

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

    let [graphViz, setGraphViz] = useState("");
    useEffect(() => {
        const graph = new RouteGraph();
        addTargetPoint(graph, target)
        for (const [server, [_, data]] of Object.entries(responses.current)) {
            if (data) {
                graphFromFeed(server, data, target, graph);
            }
        }

        const graphviz = graph.toGraphviz();
        console.log("Graph:", graphviz);
        setGraphViz(graphviz);
    }, [counterUpdate]);

    const svgHook = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (svgHook.current) {
            d3graphviz.graphviz(svgHook.current)
                .renderDot(graphViz);
        }
    }, [graphViz]);

    return (
        <Box sx={{ height: "100%", width: "100%", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            {isLoading && <LinearProgress />}
            <Box className={styles.bgpmap} ref={svgHook} style={{ flexGrow: 1 }} />
        </Box>
    );
}
