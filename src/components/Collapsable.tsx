import { Box } from "@mui/material";

export function Collapsable({
    collapsed, children
}: {
    collapsed: boolean;
    children: React.ReactNode;
}) {
    return (
        <Box className={"collapsible-wrapper" + (collapsed ? " not-collapsed" : "")}>
            <div />
            <Box className="collapsible">
                {children}
            </Box>
        </Box>
    );
}
