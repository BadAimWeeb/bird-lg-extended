"use client";

import { createContext, useContext } from "react";
import type { getServersClientView } from "@/utils_server/servers_client_view";

export const DynamicEnvVariableContext = createContext<{
    title: string;
    description: string;
    navbarBrand: string;
    ibgpRegex: string;
    summaryDefaultViewProtocol: string;
    useUnstableServerIdentifier: boolean;

    tmp_serversClientView: string[];
}>({
    title: "Bird LG Extended",
    description: "looking glass & network tools using bird-lg",
    navbarBrand: "Bird LG Extended",
    ibgpRegex: "^ibgp_.*",
    summaryDefaultViewProtocol: "bgp,ospf,isis,babel",
    useUnstableServerIdentifier: false,

    tmp_serversClientView: []
});
export const DynamicEnvVariableProvider = DynamicEnvVariableContext.Provider;
export const DynamicEnvVariableConsumer = DynamicEnvVariableContext.Consumer;
export const useDynamicEnvVariable = () => useContext(DynamicEnvVariableContext);