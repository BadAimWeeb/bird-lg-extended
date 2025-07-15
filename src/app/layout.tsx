import type { Metadata } from "next";
import "@/app/globals.css";

import { getDynamicClientConfig } from "@/utils_server/dynamic_brand";

const dynamicConfig = await getDynamicClientConfig();

export const metadata: Metadata = {
  title: dynamicConfig.title || "Bird LG Extended",
  description: dynamicConfig.description || "looking glass & network tools using bird-lg",
};

import RootLayout from "./layout.client";
import { DynamicEnvVariableProvider } from "@/components/DynamicEnvVariable";
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootLayout dynamic={{
    title: dynamicConfig.title || "Bird LG Extended",
    description: dynamicConfig.description || "looking glass & network tools using bird-lg",
    navbarBrand: dynamicConfig.navbarBrand || "Bird LG Extended",
    ibgpRegex: dynamicConfig.ibgpRegex || "^ibgp_.*",
    summaryDefaultViewProtocol: dynamicConfig.summaryDefaultViewProtocol || "bgp,ospf,isis,babel"
  }}>{children}</RootLayout>;
};
