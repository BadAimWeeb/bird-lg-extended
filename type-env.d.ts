declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
        NEXT_PUBLIC_TITLE?: string;
        NEXT_PUBLIC_DESCRIPTION?: string;
        NEXT_PUBLIC_NAVBAR_BRAND?: string;
        NEXT_PUBLIC_IBGP_REGEX?: string;
        NEXT_PUBLIC_SUMMARY_DEFAULT_VIEW_PROTOCOL?: string;
        DEFAULT_PROXY_PORT?: string;
        DEFAULT_BIRD_LG_DOMAIN?: string;
        WHOIS_SERVER?: string;
        SERVERS?: string;
    }
}
