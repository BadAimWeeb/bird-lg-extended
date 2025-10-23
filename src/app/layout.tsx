import type { Metadata } from "next";
import "@/app/globals.css";

import { getDynamicClientConfig } from "@/utils_server/dynamic_brand";

export const dynamic = "force-dynamic";

const dynamicConfig = await getDynamicClientConfig();

export const metadata: Metadata = {
  title: dynamicConfig.title || "Bird LG Extended",
  description: dynamicConfig.description || "looking glass & network tools using bird-lg",
};

import RootLayout from "./layout.client";
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootLayout dynamic={{
    title: dynamicConfig.title || "Bird LG Extended",
    description: dynamicConfig.description || "looking glass & network tools using bird-lg",
    navbarBrand: dynamicConfig.navbarBrand || "Bird LG Extended",
    ibgpRegex: dynamicConfig.ibgpRegex || "^ibgp_.*",
    summaryDefaultViewProtocol: dynamicConfig.summaryDefaultViewProtocol || "bgp,ospf,isis,babel",
    /* AS4242423797 specific interface for better server selection. */
    baw_useLargeQueryInterface: dynamicConfig.baw_useLargeQueryInterface || false,
    useUnstableServerIdentifier: dynamicConfig.useUnstableServerIdentifier || false
  }}>{children}</RootLayout>;
};
