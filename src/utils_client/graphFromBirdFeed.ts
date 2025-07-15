import { RouteGraph } from "./Graph";

const protocolNameRe = /\[(.*?) .*\]/;
const routeSplitRe = /(unicast|blackhole|unreachable|prohibited)/;
const routeViaRe = /^\t(via .*?)$/m;
const routeASPathRe = /^\tBGP\.as_path: (.*?)$/m;

function makeEdgeAttrs(preferred: boolean): Record<string, string> {
    const result: Record<string, string> = { fontsize: "12.0" };
    if (preferred) result["color"] = "red";
    return result;
}

function makePointAttrs(preferred: boolean): Record<string, string> {
    const result: Record<string, string> = {};
    if (preferred) result["color"] = "red";
    return result;
}

export function addTargetPoint(graph: RouteGraph, target: string): void {
    graph.addPoint(target, false, { color: "red", shape: "diamond" });
}

export function graphFromFeed(server: string, feed: string, target: string, graph: RouteGraph): RouteGraph {
    graph.addPoint(server, false, { color: "blue", shape: "box" });
    const routes = feed.split(routeSplitRe);

    for (let routeIndex = 1; routeIndex < routes.length; routeIndex += 2) {
        const route = routes[routeIndex + 1] || "";
        let via = "";
        let paths: string[] = [];
        const routePreferred = route.includes("*");
        let protocolName = "";

        const viaMatch = route.match(routeViaRe);
        if (viaMatch && viaMatch[1]) {
            via = viaMatch[1].trim();
        }

        const asPathMatch = route.match(routeASPathRe);
        if (asPathMatch && asPathMatch[1]) {
            const pathString = asPathMatch[1].trim();
            if (pathString.length > 0) {
                paths = pathString.split(" ").map(p => p.replace(/^\(/, "").replace(/\)$/, ""));
            }
        }

        const protocolMatch = route.match(protocolNameRe);
        if (protocolMatch && protocolMatch[1]) {
            protocolName = protocolMatch[1].trim();
            if (routePreferred) protocolName += "*";
        }

        if (paths.length === 0) {
            graph.addEdge(server, target, (protocolName + "\n" + via).trim(), makeEdgeAttrs(routePreferred));
            continue;
        }

        for (let i = 0; i < paths.length; i++) {
            let src: string;
            let label: string;
            if (i === 0) {
                src = server;
                label = (protocolName + "\n" + via).trim();
            } else {
                src = paths[i - 1];
                label = "";
            }
            const dst = paths[i];
            graph.addEdge(src, dst, label, makeEdgeAttrs(routePreferred));
            graph.addPoint(dst, true, makePointAttrs(routePreferred));
        }

        const src = paths[paths.length - 1];
        graph.addEdge(src, target, "", makeEdgeAttrs(routePreferred));
    }

    return graph;
}
