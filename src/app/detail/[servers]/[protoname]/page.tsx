"use client";

import { CommandStream } from "@/components/CommandStream";
import { Container } from "@mui/material";
import { use } from "react";

export default function ProtoDetails({
    params,
}: {
    params: Promise<{ servers: string; protoname: string }>;
}) {
    const p = use(params);

    return <Container sx={{ mt: 2 }}>
        <CommandStream cmd={`show protocols all "${p.protoname}"`} servers={decodeURIComponent(p.servers).split("+")} />
    </Container>;
}
