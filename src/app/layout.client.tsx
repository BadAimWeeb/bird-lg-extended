"use client";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Roboto, Roboto_Mono } from "next/font/google";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AppBar, Box, Button, Container, Divider, FormControl, InputLabel, LinearProgress, MenuItem, OutlinedInput, Select, type SelectChangeEvent, TextField, Toolbar, Typography } from "@mui/material";
import Link from 'next/link';
import { getServersClientView } from '@/utils_server/servers_client_view';
import { usePathname, useRouter } from 'next/navigation';
import StartIcon from "@mui/icons-material/Start"
import { decode } from 'punycode';

const roboto = Roboto({
    variable: "--font-roboto",
    subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin"],
});

const ALL_SERVERS_VALUE = "BIRD_LG_EXTENDED_ALL_SERVERS";
const ROUTES = {
    "summary": "show protocols",
    "detail": "show protocols all \"...\"",
    "route_from_protocol": "show route protocol \"...\"",
    "route_from_protocol_all": "show route protocol \"...\" all",
    "route_from_protocol_primary": "show route protocol \"...\" primary",
    "route_from_protocol_all_primary": "show route protocol \"...\" all primary",
    "route_filtered_from_protocol": "show route filtered protocol \"...\"",
    "route_filtered_from_protocol_all": "show route filtered protocol \"...\" all",
    "route_from_origin": "show route where bgp_path.last = ...",
    "route_from_origin_all": "show route where bgp_path.last = ... all",
    "route_from_origin_primary": "show route where bgp_path.last = ... primary",
    "route_from_origin_all_primary": "show route where bgp_path.last = ... all primary",
    "route": "show route for ...",
    "route_all": "show route for ... all",
    "route_where": "show route where net ~ [ ... ]",
    "route_where_all": "show route where net ~ [ ... ] all",
    "route_generic": "show route ...",
    "generic": "show ...",
    "whois": "whois ...",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [theme] = useState(() => createTheme({
        colorSchemes: {
            dark: true,
        },
    }));

    const [queryValue, setQueryValue] = useState<string>("");
    const [queryType, setQueryType] = useState<string>("generic");
    const [servers, setServers] = useState<string[]>([]);
    const [availableServers, setAvailableServers] = useState<string[]>([]);

    useEffect(() => {
        getServersClientView().then(setAvailableServers);
    }, []);

    const handleChangeServerSelect = useCallback((event: SelectChangeEvent<typeof servers>) => {
        const {
            target: { value },
        } = event;

        const newServers = typeof value === 'string' ? value.split(',') : value;
        setServers(oldServers => {
            const oldListAllSelected = oldServers.includes(ALL_SERVERS_VALUE);
            const newListAllSelected = newServers.includes(ALL_SERVERS_VALUE);
            if (oldListAllSelected && !newListAllSelected) {
                // All servers were selected, but now they are not.
                // Remove ALL servers
                return [];
            } else if (!oldListAllSelected && newListAllSelected) {
                // All servers were not selected, but now they are.
                // Select all servers
                return [ALL_SERVERS_VALUE].concat(availableServers);
            } else {
                const filteredNewList = newServers.filter(server => server !== ALL_SERVERS_VALUE);
                // If ALL servers are selected, flag All Servers
                if (filteredNewList.length === availableServers.length) {
                    return [ALL_SERVERS_VALUE].concat(filteredNewList);
                } else {
                    return filteredNewList;
                }
            }
        });
    }, [availableServers]);

    const handleChangeQueryType = useCallback((event: SelectChangeEvent<string>) => {
        setQueryType(event.target.value);
    }, []);

    const handleChangeQueryValue = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQueryValue(event.target.value);
    }, []);

    const router = useRouter();
    const handleStartQuery = useCallback(() => {
        const sText = (servers.includes(ALL_SERVERS_VALUE) ? availableServers : servers).join('+');

        if (queryType === "whois") {
            router.push(`/whois/${encodeURIComponent(queryValue)}`);
        } else {
            router.push(`/${queryType}/${encodeURIComponent(sText)}/${encodeURIComponent(queryValue)}`);
        }
    }, [queryType, queryValue, servers, router]);

    const pathname = usePathname();
    useEffect(() => {
        const splitPath = pathname.split('/');
        const method = splitPath[1];
        if (method && Object.keys(ROUTES).includes(method)) {
            setQueryType(method);
        } else {
            setQueryType("generic");
        }

        if (method !== "whois") {
            const serversInPath = splitPath[2];

            if (serversInPath) {
                const servers = decodeURIComponent(serversInPath).split('+');
                if (servers.length === availableServers.length && servers.every(server => availableServers.includes(server))) {
                    setServers([ALL_SERVERS_VALUE].concat(availableServers));
                } else {
                    setServers(servers);
                }
            } else {
                setServers([ALL_SERVERS_VALUE].concat(availableServers));
            }

            const queryValue = splitPath[3];
            if (queryValue) {
                setQueryValue(decodeURIComponent(queryValue));
            } else {
                setQueryValue("");
            }
        } else {
            setServers([ALL_SERVERS_VALUE].concat(availableServers));
            const queryValue = splitPath[2];
            setQueryValue(decodeURIComponent(queryValue || ""));
        }
    }, [pathname, availableServers]);

    return (
        <html lang="en">
            <body className={`${roboto.variable} ${robotoMono.variable}`}>
                <ThemeProvider theme={theme}>
                    <Box>
                        <AppBar position="static">
                            <Toolbar sx={{ flexWrap: "wrap", gap: 2, p: 1 }}>
                                <Link href="/summary">
                                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                        {process.env.NEXT_PUBLIC_NAVBAR_BRAND || "bird-lg Extended"}
                                    </Typography>
                                </Link>
                                <Box sx={{ flexGrow: 1 }} />
                                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                                    <FormControl sx={{ minWidth: 150, maxWidth: 200, flexGrow: 1 }}>
                                        <InputLabel id="multiserver-selector-label">Servers</InputLabel>
                                        <Select
                                            labelId="multiserver-selector-label"
                                            id="multiserver-selector"
                                            multiple
                                            value={servers}
                                            onChange={handleChangeServerSelect}
                                            input={<OutlinedInput label="Servers" size="small" />}
                                            renderValue={(selected) => (
                                                selected.includes(ALL_SERVERS_VALUE) ? "All Servers" : selected.sort().join(', ')
                                            )}
                                            sx={{ fontSize: 14 }}
                                        >
                                            <MenuItem value={ALL_SERVERS_VALUE}>
                                                All Servers
                                            </MenuItem>
                                            <Divider />
                                            {availableServers.map((name) => (
                                                <MenuItem
                                                    key={name}
                                                    value={name}
                                                >
                                                    {name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Select
                                        value={queryType}
                                        onChange={handleChangeQueryType}
                                        size="small"
                                        sx={{ width: 300, fontSize: 14 }}
                                    >
                                        {Object.entries(ROUTES).map(([key, value]) => (
                                            <MenuItem key={key} value={key}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <TextField
                                        value={queryValue}
                                        onChange={handleChangeQueryValue}
                                        size="small"
                                        sx={{ maxWidth: 300, fontSize: 14, flexGrow: 100 }}
                                        placeholder="Target..."
                                    />
                                    <Button color="success" variant="contained" onClick={handleStartQuery} sx={{ height: 40 }}><StartIcon /></Button>
                                </Box>
                            </Toolbar>
                        </AppBar>

                        <Suspense fallback={<Container sx={{ mt: 2 }}><LinearProgress /></Container>}>
                            {children}
                        </Suspense>
                    </Box>
                </ThemeProvider>
            </body>
        </html>
    );
}
