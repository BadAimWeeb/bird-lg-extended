"use client";

import { CommandStream } from "@/components/CommandStream";
import { Container } from "@mui/material";
import { use } from "react";

export default function RouteGeneric({
    params,
}: {
    params: Promise<{ servers: string; targets: string }>;
}) {
    const p = use(params);

    return <Container sx={{ mt: 2 }}>
        <CommandStream type="traceroute" cmd={decodeURIComponent(p.targets || "")} servers={decodeURIComponent(p.servers).split("+")} />
    </Container>;
}
