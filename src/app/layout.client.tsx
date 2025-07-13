"use client";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Roboto, Roboto_Mono } from "next/font/google";
import { useState } from "react";
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import Link from 'next/link';

const roboto = Roboto({
    variable: "--font-roboto",
    subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    "use client";

    const [theme] = useState(() => createTheme({
        colorSchemes: {
            dark: true,
        },
    }));

    return (
        <html lang="en">
            <body className={`${roboto.variable} ${robotoMono.variable}`}>
                <ThemeProvider theme={theme}>
                    <Box>
                        <AppBar position="static">
                            <Toolbar>
                                <Link href="/summary">
                                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                        {process.env.NEXT_PUBLIC_NAVBAR_BRAND || "bird-lg Extended"}
                                    </Typography>
                                </Link>
                            </Toolbar>
                        </AppBar>

                        {children}
                    </Box>
                </ThemeProvider>
            </body>
        </html>
    );
}
