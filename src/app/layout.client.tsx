"use client";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Roboto, Roboto_Mono } from "next/font/google";
import { Suspense, use, useCallback, useEffect, useState } from "react";
import { AppBar, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, InputLabel, LinearProgress, MenuItem, OutlinedInput, Select, type SelectChangeEvent, TextField, Toolbar, Typography } from "@mui/material";
import Link from 'next/link';
import { getServersClientView } from '@/utils_server/servers_client_view';
import { usePathname, useRouter } from 'next/navigation';
import StartIcon from "@mui/icons-material/Start";
import { DynamicEnvVariableProvider, useDynamicEnvVariable } from '@/components/DynamicEnvVariable';
import { LargeQueryInterface } from '@/components/LargeQuery';
import { ROUTES } from '../utils_client/availableURLRoute';

const roboto = Roboto({
    variable: "--font-roboto",
    subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin"],
});

const ALL_SERVERS_VALUE = "BIRD_LG_EXTENDED_ALL_SERVERS";
export default function RootLayout({
    children,
    dynamic
}: Readonly<{
    children: React.ReactNode;
    dynamic: {
        title: string;
        description: string;
        navbarBrand: string;
        ibgpRegex: string;
        summaryDefaultViewProtocol: string;
        baw_useLargeQueryInterface: boolean;
        useUnstableServerIdentifier: boolean;

        tmp_serversClientView: string[];
    };
}>) {
    const dynamicConfig = dynamic;

    const [theme] = useState(() => createTheme({
        colorSchemes: {
            dark: true,
        },
        palette: {
            primary: {
                main: "#26C6DA",
                light: "#80DEEA",
                dark: "#00ACC1",
                contrastText: "#000000"
            }
        }
    }));

    const [showLargeQueryInterface, setShowLargeQueryInterface] = useState(false);
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

    const router = useRouter();
    const handleStartQuery = useCallback(() => {
        const s = servers.includes(ALL_SERVERS_VALUE) && !dynamic.baw_useLargeQueryInterface ? availableServers : servers.filter(x => x != ALL_SERVERS_VALUE);
        const sText = dynamic.useUnstableServerIdentifier ? (
            s.map(server => {
                const index = availableServers.indexOf(server);
                return index >= 0 ? BigInt(1) << BigInt(index) : BigInt(0);
            })
                .reduce((acc, curr) => acc | curr, BigInt(0)).toString()
        ) : s.join("+");

        if (queryType === "whois") {
            router.push(`/whois/${encodeURIComponent(queryValue)}`);
        } else {
            router.push(`/${queryType}/${encodeURIComponent(sText)}/${encodeURIComponent(queryValue)}`);
        }
    }, [queryType, queryValue, servers, router, dynamic]);

    const handleChangeQueryType = useCallback((event: SelectChangeEvent<string>) => {
        setQueryType(event.target.value);
    }, []);

    const handleChangeQueryValue = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQueryValue(event.target.value);
    }, []);

    const handleEnterQueryValue = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleStartQuery();
        }
    }, [handleStartQuery]);

    const handleLargeQueryInterfaceOpen = useCallback(() => {
        setShowLargeQueryInterface(true);
    }, []);

    const handleLargeQueryInterfaceRequestClose = useCallback(() => {
        setShowLargeQueryInterface(false);
    }, []);

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
                if (dynamic.useUnstableServerIdentifier) {
                    try {
                        const bi = BigInt(serversInPath);
                        const servers: string[] = [];

                        availableServers.forEach((server, index) => {
                            if ((bi & (BigInt(1) << BigInt(index))) !== BigInt(0)) {
                                servers.push(server);
                            }
                        });

                        if (servers.length === availableServers.length) {
                            setServers((dynamic.baw_useLargeQueryInterface ? [] : [ALL_SERVERS_VALUE]).concat(availableServers));
                        } else {
                            setServers(servers);
                        }
                    } catch {}
                } else {
                    const servers = decodeURIComponent(serversInPath).split('+');
                    if (servers.length === availableServers.length && servers.every(server => availableServers.includes(server))) {
                        setServers((dynamic.baw_useLargeQueryInterface ? [] : [ALL_SERVERS_VALUE]).concat(availableServers));
                    } else {
                        setServers(servers);
                    }
                }
            } else {
                setServers((dynamic.baw_useLargeQueryInterface ? [] : [ALL_SERVERS_VALUE]).concat(availableServers));
            }

            const queryValue = splitPath[3];
            if (queryValue) {
                setQueryValue(decodeURIComponent(queryValue));
            } else {
                setQueryValue("");
            }
        } else {
            setServers((dynamic.baw_useLargeQueryInterface ? [] : [ALL_SERVERS_VALUE]).concat(availableServers));
            const queryValue = splitPath[2];
            setQueryValue(decodeURIComponent(queryValue || ""));
        }
    }, [pathname, availableServers, dynamic]);

    return (
        <html lang="en">
            <body className={`${roboto.variable} ${robotoMono.variable}`}>
                <DynamicEnvVariableProvider value={dynamic}>
                    <ThemeProvider theme={theme}>
                        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                            <AppBar position="static" color="primary">
                                <Toolbar sx={{ flexWrap: "wrap", gap: 2, p: 1 }}>
                                    <Link href="/summary">
                                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                            {dynamicConfig.navbarBrand || "bird-lg Extended"}
                                        </Typography>
                                    </Link>
                                    <Box sx={{ flexGrow: 1 }} />
                                    {dynamicConfig.baw_useLargeQueryInterface ? (
                                        <>
                                            <Button
                                                size="small"
                                                sx={{ maxWidth: 150, fontSize: 14, flexGrow: 100 }}
                                                onClick={handleLargeQueryInterfaceOpen}
                                                variant='outlined'
                                            >
                                                Query...
                                            </Button>
                                            <Dialog
                                                open={showLargeQueryInterface}
                                                onClose={handleLargeQueryInterfaceRequestClose}
                                                slotProps={{
                                                    paper: {
                                                        sx: {
                                                            maxWidth: "min(90vw, 1200px)",
                                                            width: "100%"
                                                        }
                                                    }
                                                }}
                                            >
                                                <DialogTitle>
                                                    Query
                                                </DialogTitle>
                                                <DialogContent>
                                                    <LargeQueryInterface
                                                        availableServers={availableServers}
                                                        currentServerSelection={servers}
                                                        onServerSelectionChange={setServers}
                                                        queryType={queryType}
                                                        onQueryTypeChange={setQueryType}
                                                        queryValue={queryValue}
                                                        onQueryValueChange={setQueryValue}
                                                        callSubmit={() => {
                                                            handleStartQuery();
                                                            handleLargeQueryInterfaceRequestClose();
                                                        }}
                                                    />
                                                </DialogContent>
                                                <DialogActions>
                                                    <Button onClick={handleLargeQueryInterfaceRequestClose} color="error">Close</Button>
                                                    <Button onClick={() => {
                                                        handleStartQuery();
                                                        handleLargeQueryInterfaceRequestClose();
                                                    }} color="warning">
                                                        Query
                                                    </Button>
                                                </DialogActions>
                                            </Dialog>
                                        </>
                                    ) : (
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
                                                onKeyUp={handleEnterQueryValue}
                                                size="small"
                                                sx={{ maxWidth: 300, fontSize: 14, flexGrow: 100 }}
                                                placeholder="Target..."
                                            />
                                            <Button color="success" variant="contained" onClick={handleStartQuery} sx={{ height: 40 }}><StartIcon /></Button>
                                        </Box>)}
                                </Toolbar>
                            </AppBar>

                            <Suspense fallback={<Container sx={{ mt: 2 }}><LinearProgress /></Container>}>
                                <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                                    {children}
                                </Box>
                            </Suspense>
                        </Box>
                    </ThemeProvider>
                </DynamicEnvVariableProvider>
            </body>
        </html>
    );
}
