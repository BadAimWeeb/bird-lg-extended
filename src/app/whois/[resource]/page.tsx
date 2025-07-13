"use client";

import { SmartRender } from "@/components/SmartRender";
import { Box, Container, LinearProgress, Typography } from "@mui/material";
import { use, useEffect, useState } from "react";

export default function Whois({ params }: {
    params: Promise<{ resource: string }>
}) {
    const p = use(params);

    const [whoisData, setWhoisData] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/whois?resource=${encodeURIComponent(p.resource)}`);
            if (response.ok) {
                const data = await response.text();
                setWhoisData(data);
            } else {
                setWhoisData("Error fetching WHOIS data");
            }
        };

        fetchData();
    }, [p.resource]);

    return (
        <Container sx={{ mt: 2 }}>
            {whoisData === null ? (<LinearProgress />) : null}
            <Box sx={{ mb: 1 }}>
                <Typography variant="h6" component="span">
                    WHOIS information for: <strong>{decodeURIComponent(p.resource)}</strong>
                </Typography>
            </Box>
            <code style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                <SmartRender birdOutput={whoisData || ""} />
            </code>
        </Container>
    );
}
