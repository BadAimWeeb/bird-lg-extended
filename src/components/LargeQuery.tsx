import { Box, Button, Checkbox, FormControlLabel, MenuItem, Select, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { CountryToContinent } from "@/utils_client/CountryToContinent";
import { ROUTES } from "@/utils_client/availableURLRoute";

const SCMIX = /^(?:(?<country>[a-z]{2})-(?<region>[a-z0-9]+) \((?<sc>[A-Za-z0-9]+)\))|(?:(?<sc>[A-Za-z0-9]+) \((?<country>[a-z]{2})-(?<region>[a-z0-9]+)\))$/;

export function LargeQueryInterface({
    availableServers,
    currentServerSelection,
    onServerSelectionChange,
    queryType,
    onQueryTypeChange,
    queryValue,
    onQueryValueChange,
    callSubmit
}: {
    availableServers: string[],
    currentServerSelection?: string[],
    onServerSelectionChange?: (newSelection: string[]) => void,
    queryType: string,
    onQueryTypeChange: (newQueryType: string) => void,
    queryValue: string,
    onQueryValueChange: (value: string) => void,
    callSubmit?: () => void
}) {
    const [regions, setRegions] = useState<string[]>(["All Regions"]);
    const [regionDisplayValue, setRegionDisplayValue] = useState<string>("All Regions");

    const availableServersWithRegion = useMemo(() => availableServers.map(server => {
        const matched = SCMIX.exec(server);
        console.log(matched);
        const continent = CountryToContinent[matched?.groups?.country?.toUpperCase() || ""] || "Other";

        return {
            server,
            country: matched?.groups?.country || "xx",
            airport: matched?.groups?.region || "zzz",
            region: continent
        };
    }), [availableServers]);

    const filteredServers = useMemo(() => {
        if (regionDisplayValue === "All Regions") {
            return availableServersWithRegion
                .sort((a, b) => a.country.localeCompare(b.country) || a.airport.localeCompare(b.airport));
        } else {
            return availableServersWithRegion
                .filter(s => s.region === regionDisplayValue)
                .sort((a, b) => a.country.localeCompare(b.country) || a.airport.localeCompare(b.airport));
        }
    }, [availableServersWithRegion, regionDisplayValue]);

    useEffect(() => {
        const regionSet: Set<string> = new Set();
        for (const server of availableServersWithRegion) {
            regionSet.add(server.region);
        }

        console.log(regionSet);

        setRegions(["All Regions", ...Array.from(regionSet).sort()]);
    }, [availableServersWithRegion]);

    return (
        <>
            <Typography variant="body1" sx={{ fontWeight: "bold" }} gutterBottom>
                Servers
            </Typography>
            <Tabs
                variant="scrollable"
                scrollButtons="auto"
                value={regionDisplayValue}
                onChange={(event, newValue) => setRegionDisplayValue(newValue)}
            >
                {regions.map((region, index) => (
                    <Tab key={index} label={region} value={region} />
                ))}
            </Tabs>
            <Button sx={{ mt: 2 }} variant="outlined" size="small" onClick={() => {
                if (onServerSelectionChange) {
                    const s = new Set<string>(currentServerSelection || []);
                    for (const { server } of filteredServers) {
                        s.add(server);
                    }

                    onServerSelectionChange(Array.from(s).sort());
                }
            }}>Select All</Button>
            <Button sx={{ mt: 2, ml: 1 }} variant="outlined" size="small" onClick={() => {
                if (onServerSelectionChange) {
                    const s = new Set<string>(currentServerSelection || []);
                    for (const { server } of filteredServers) {
                        s.delete(server);
                    }

                    onServerSelectionChange(Array.from(s).sort());
                }
            }} color="error">Deselect All</Button>
            <Box sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 1,
                maxHeight: '400px',
                maxWidth: '100%',
                overflowY: 'auto'
            }}>
                {filteredServers.map(({ server }, index) => {
                    const isSelected = currentServerSelection ? currentServerSelection.includes(server) : false;
                    return (
                        <FormControlLabel
                            sx={{
                                minWidth: "150px"
                            }}
                            control={
                                <Checkbox key={index}
                                    checked={isSelected}
                                    onChange={(event) => {
                                        if (onServerSelectionChange) {
                                            if (event.target.checked) {
                                                onServerSelectionChange([...(currentServerSelection || []), server]);
                                            } else {
                                                onServerSelectionChange((currentServerSelection || []).filter(s => s !== server));
                                            }
                                        }
                                    }}
                                />
                            }
                            label={server}
                        />
                    );
                })}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: "bold", mt: 2 }} gutterBottom>
                Query Type
            </Typography>
            <Select
                value={queryType}
                onChange={(event) => onQueryTypeChange(event.target.value)}
                size="small"
                sx={{ fontSize: 14 }}
                fullWidth
            >
                {Object.entries(ROUTES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                        {value}
                    </MenuItem>
                ))}
            </Select>
            <TextField
                value={queryValue}
                onChange={(event) => onQueryValueChange(event.target.value)}
                onKeyUp={(event) => {
                    if (event.key === 'Enter' && callSubmit) {
                        callSubmit();
                    }
                }}
                size="small"
                sx={{ fontSize: 14 }}
                fullWidth
                placeholder="Target..."
            />
        </>
    )
}
