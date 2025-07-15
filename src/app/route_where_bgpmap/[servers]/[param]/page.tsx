"use client";

import { BGPMap } from "@/components/BGPMap";
import { Box } from "@mui/material";
import { use } from "react";

export default function RouteAll({
    params,
}: {
    params: Promise<{ servers: string; param: string }>;
}) {
    const p = use(params);

    return <BGPMap target={decodeURIComponent(p.param || "")} cmd={`show route where net ~ [ ${decodeURIComponent(p.param || "")} ] all`} servers={decodeURIComponent(p.servers).split("+")} />;
}
