"use client";

import { CommandStream } from "@/components/CommandStream";
import { Container } from "@mui/material";
import { use } from "react";

export default function Generic({
    params,
}: {
    params: Promise<{ servers: string; param: string }>;
}) {
    const p = use(params);

    return <Container sx={{ mt: 2 }}>
        <CommandStream cmd={`show ${decodeURIComponent(p.param || "")}`} servers={decodeURIComponent(p.servers).split("+")} />
    </Container>;
}
