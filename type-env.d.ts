declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
        FRONTEND_TITLE?: string;
        FRONTEND_DESCRIPTION?: string;
        FRONTEND_NAVBAR_BRAND?: string;
        FRONTEND_IBGP_REGEX?: string;
        FRONTEND_SUMMARY_DEFAULT_VIEW_PROTOCOL?: string;
        DEFAULT_PROXY_PORT?: string;
        DEFAULT_BIRD_LG_DOMAIN?: string;
        WHOIS_SERVER?: string;
        SERVERS?: string;
    }
}
