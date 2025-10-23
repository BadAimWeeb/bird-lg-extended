"use client";

import { createContext, useContext } from "react";

export const DynamicEnvVariableContext = createContext<{
    title: string;
    description: string;
    navbarBrand: string;
    ibgpRegex: string;
    summaryDefaultViewProtocol: string;
    useUnstableServerIdentifier: boolean;
}>({
    title: "Bird LG Extended",
    description: "looking glass & network tools using bird-lg",
    navbarBrand: "Bird LG Extended",
    ibgpRegex: "^ibgp_.*",
    summaryDefaultViewProtocol: "bgp,ospf,isis,babel",
    useUnstableServerIdentifier: false
});
export const DynamicEnvVariableProvider = DynamicEnvVariableContext.Provider;
export const DynamicEnvVariableConsumer = DynamicEnvVariableContext.Consumer;
export const useDynamicEnvVariable = () => useContext(DynamicEnvVariableContext);