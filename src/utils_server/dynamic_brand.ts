"use server";

export async function getDynamicClientConfig() {
    return {
        title: process.env.NEXT_PUBLIC_TITLE,
        description: process.env.NEXT_PUBLIC_DESCRIPTION,
        navbarBrand: process.env.NEXT_PUBLIC_NAVBAR_BRAND,
        ibgpRegex: process.env.NEXT_PUBLIC_IBGP_REGEX,
        summaryDefaultViewProtocol: process.env.NEXT_PUBLIC_SUMMARY_DEFAULT_VIEW_PROTOCOL
    };
}
