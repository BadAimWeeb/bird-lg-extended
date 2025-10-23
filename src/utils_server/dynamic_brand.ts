"use server";

export async function getDynamicClientConfig() {
    return {
        title: process.env.FRONTEND_TITLE,
        description: process.env.FRONTEND_DESCRIPTION,
        navbarBrand: process.env.FRONTEND_NAVBAR_BRAND,
        ibgpRegex: process.env.FRONTEND_IBGP_REGEX,
        summaryDefaultViewProtocol: process.env.FRONTEND_SUMMARY_DEFAULT_VIEW_PROTOCOL,
        baw_useLargeQueryInterface: process.env.BAW_USE_LARGE_QUERY_INTERFACE === "true",
        useUnstableServerIdentifier: process.env.USE_SERVER_INDEX_AS_IDENTIFIER === "true"
    };
}
