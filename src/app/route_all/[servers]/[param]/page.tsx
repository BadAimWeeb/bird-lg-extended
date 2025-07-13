"use client";

import { CommandStream } from "@/components/CommandStream";
import { Container } from "@mui/material";
import { use } from "react";

export default function RouteAll({
    params,
}: {
    params: Promise<{ servers: string; param: string }>;
}) {
    const p = use(params);

    return <Container sx={{ mt: 2 }}>
        <CommandStream cmd={`show route for ${decodeURIComponent(p.param || "")} all`} servers={decodeURIComponent(p.servers).split("+")} />
    </Container>;
}
