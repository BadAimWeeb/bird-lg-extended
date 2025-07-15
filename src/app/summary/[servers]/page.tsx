"use client";

import { Box, Button, Checkbox, Container, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, OutlinedInput, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Collapsable } from "@/components/Collapsable";
import Link from "next/link";
import { useDynamicEnvVariable } from "@/components/DynamicEnvVariable";

const NAME_MAPPINGLIST: Record<string, string> = {
    "bgp": "BGP",
    "ospf": "OSPF",
    "isis": "ISIS",
    "babel": "Babel",
    "aggregator": "Aggregator",
    "bfd": "BFD",
    "bmp": "BMP",
    "device": "Device",
    "direct": "Direct",
    "kernel": "Kernel",
    "l3vpn": "L3VPN",
    "mrt": "MRT",
    "pipe": "Pipe",
    "radv": "RAdv",
    "rip": "RIP",
    "rpki": "RPKI",
    "static": "Static",
    "ebgp": "eBGP",
    "ibgp": "iBGP"
};

export default function Overview({
    params
}: {
    params: Promise<{ servers?: string }>
}) {
    const dynamicEnvVariable = useDynamicEnvVariable();
    const REGEX_IBGP = useMemo(() => new RegExp(dynamicEnvVariable.ibgpRegex || "^ibgp_.*"), [dynamicEnvVariable]);
    const DEFAULT_VIEW_PROTOCOL_STRING = useMemo(() => dynamicEnvVariable.summaryDefaultViewProtocol || "bgp,ospf,isis,babel", [dynamicEnvVariable]);
    const DEFAULT_VIEW_PROTOCOLS = useMemo(() => DEFAULT_VIEW_PROTOCOL_STRING.split(",").map(proto => proto.trim()), [DEFAULT_VIEW_PROTOCOL_STRING]);

    const servers = use(params);
    const serversArray = useMemo(() => servers?.servers ? decodeURIComponent(servers.servers).split('+').map(s => s.trim()) : [], [servers]);
    const theme = useTheme();

    const [summary, setSummary] = useState<Record<string, [lastUpdated: number, data?: {
        name: string;
        proto: string;
        table: string;
        state: string;
        since: string;
        info: string;
    }[] | undefined]>>({});

    useEffect(() => {
        function fetchOverview() {
            fetch("/api/summary" + (serversArray.length > 0 ? `?servers=${encodeURIComponent(serversArray.join(','))}` : ""))
                .then((response) => response.json())
                .then((data) => {
                    setSummary(data);
                });
        }

        fetchOverview();
        const interval = setInterval(fetchOverview, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [serversArray]);

    const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(() => new Set(DEFAULT_VIEW_PROTOCOLS));
    const availableProtocolTypes = useMemo(() => {
        const protocols = new Set<string>();
        console.log(summary);
        Object.values(summary).forEach(([_, data]) => {
            console.log(_, data)
            data?.forEach(entry => {
                if (entry.proto) {
                    protocols.add(entry.proto.toLocaleLowerCase());
                }
            });
        });
        return Array.from(protocols).sort();
    }, [summary]);

    const entryFilter = useCallback(({ name, proto }: {
        name: string;
        proto: string;
    }) => {
        if (selectedProtocols.size === 0) {
            return true; // No filter applied, show all entries
        }

        if (proto === "BGP") {
            if (selectedProtocols.has("bgp")) {
                return true;
            }

            // Determine if the protocol is eBGP or iBGP
            const isIBGP = REGEX_IBGP.test(name);
            if (isIBGP && selectedProtocols.has("ibgp")) {
                return true;
            }

            if (!isIBGP && selectedProtocols.has("ebgp")) {
                return true;
            }
        } else {
            if (selectedProtocols.has(proto.toLocaleLowerCase())) {
                return true;
            }
        }

        return false;
    }, [selectedProtocols]);

    const [showSelectProtocolsCheckbox, setShowSelectProtocolsCheckbox] = useState(false);
    return <Container sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>Summary</Typography>

        <Paper sx={{ mb: 2, p: 1 }}>
            <Button component="div" color="inherit" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setShowSelectProtocolsCheckbox(!showSelectProtocolsCheckbox)}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }} gutterBottom>
                    Filter protocols
                </Typography>
                {showSelectProtocolsCheckbox ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Button>
            <Collapsable collapsed={showSelectProtocolsCheckbox}>
                <Box sx={{ p: 1 }}>
                    <FormControlLabel control={<Checkbox checked={selectedProtocols.has("bgp")} onChange={() => {
                        const newProtocols = new Set(selectedProtocols);
                        if (newProtocols.has("bgp")) {
                            newProtocols.delete("bgp");
                            newProtocols.delete("ebgp");
                            newProtocols.delete("ibgp");
                        } else {
                            newProtocols.add("bgp");
                            newProtocols.add("ebgp");
                            newProtocols.add("ibgp");
                        }
                        setSelectedProtocols(newProtocols);
                    }} />} label="BGP" />
                    {
                        dynamicEnvVariable.ibgpRegex ? (
                            <Box sx={{ display: 'inline-block', filter: 'brightness(75%)' }}>
                                <FormControlLabel control={<Checkbox checked={selectedProtocols.has("ebgp")} onChange={() => {
                                    const newProtocols = new Set(selectedProtocols);
                                    if (newProtocols.has("ebgp")) {
                                        newProtocols.delete("ebgp");
                                        newProtocols.delete("bgp");
                                    } else {
                                        newProtocols.add("ebgp");
                                        if (newProtocols.has("ibgp")) {
                                            newProtocols.add("bgp");
                                        }
                                    }
                                    setSelectedProtocols(newProtocols);
                                }} />} label="eBGP" />
                                <FormControlLabel control={<Checkbox checked={selectedProtocols.has("ibgp")} onChange={() => {
                                    const newProtocols = new Set(selectedProtocols);
                                    if (newProtocols.has("ibgp")) {
                                        newProtocols.delete("ibgp");
                                        newProtocols.delete("bgp");
                                    } else {
                                        newProtocols.add("ibgp");
                                        if (newProtocols.has("ebgp")) {
                                            newProtocols.add("bgp");
                                        }
                                    }
                                    setSelectedProtocols(newProtocols);
                                }} />} label="iBGP" />
                            </Box>
                        ) : null
                    }
                    {
                        availableProtocolTypes.filter(proto => ["ebgp", "ibgp", "bgp"].includes(proto.toLocaleLowerCase()) === false).map(proto => (
                            <FormControlLabel key={proto} control={<Checkbox checked={selectedProtocols.has(proto)} onChange={() => {
                                const newProtocols = new Set(selectedProtocols);
                                if (newProtocols.has(proto)) {
                                    newProtocols.delete(proto);
                                } else {
                                    newProtocols.add(proto);
                                }
                                setSelectedProtocols(newProtocols);
                            }} />} label={NAME_MAPPINGLIST[proto] || proto} />
                        ))
                    }
                </Box>
            </Collapsable>
        </Paper>

        {Object.entries(summary).filter(([server]) => serversArray.length ? serversArray.includes(server) : true).sort(([a], [b]) => a.localeCompare(b)).map(([server, [lastUpdated, data]]) => (
            <Box key={server} sx={{ pt: 1, pb: 1 }}>
                <Link href={`/summary/${encodeURIComponent(server)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Tooltip title={`Last updated: ${lastUpdated > 0 ? new Date(lastUpdated).toLocaleString() + (Date.now() - lastUpdated >= 15000 ? " (too long since last update ⚠️)" : "") : "Never ⚠️"}`}>
                        <Typography variant="h6" component="span" color={Date.now() - lastUpdated < 15000 ? "text.primary" : "error.main"} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>
                            {server}
                        </Typography>
                    </Tooltip>
                </Link>
                {lastUpdated > 0 ? (
                    <>
                        {data ? (
                            <TableContainer component={Paper}>
                                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell align="right">Protocol</TableCell>
                                            <TableCell align="right">Table</TableCell>
                                            <TableCell align="right">State</TableCell>
                                            <TableCell align="right">Since</TableCell>
                                            <TableCell align="right">Info</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.filter(entryFilter).map((row) => (
                                            <TableRow
                                                key={row.name}
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    bgcolor: alpha(row.state === "up" ? theme.palette.success.main : (row.info === "Passive" ? theme.palette.info.main : theme.palette.error.main), 0.8),
                                                    color: row.state === "up" ? theme.palette.success.contrastText : (row.info === "Passive" ? theme.palette.info.contrastText : theme.palette.error.contrastText),
                                                    "& *": { color: "inherit" }
                                                }}
                                            >
                                                <TableCell component="th" scope="row">
                                                    <Link href={`/detail/${encodeURIComponent(server)}/${encodeURIComponent(row.name)}`}>{row.name}</Link>
                                                </TableCell>
                                                <TableCell align="right">{row.proto}</TableCell>
                                                <TableCell align="right">{row.table}</TableCell>
                                                <TableCell align="right">{row.state}</TableCell>
                                                <TableCell align="right">{row.since}</TableCell>
                                                <TableCell align="right">{row.info}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="error">No data available</Typography>
                        )}
                    </>
                ) : (
                    <Typography variant="body2" color="error">Cannot contact server!</Typography>
                )}
            </Box>
        ))
        }
    </Container >;
}
