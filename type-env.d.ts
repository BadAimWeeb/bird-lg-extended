declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
        NEXT_PUBLIC_TITLE?: string;
        DEFAULT_PROXY_PORT?: string;
        DEFAULT_BIRD_LG_DOMAIN?: string;
        SERVERS?: string;
    }
}
