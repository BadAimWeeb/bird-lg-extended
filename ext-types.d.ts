declare module "whois" {
    export interface WhoisServer {
        host: string;
        port?: number | string;
        query?: string;
        punycode?: boolean;
    }

    export interface WhoisProxy {
        ipaddress: string;
        port: number;
        type?: number;
    }

    export interface WhoisOptions {
        server?: string | WhoisServer;
        proxy?: string | WhoisProxy;
        timeout?: number;
        follow?: number;
        punycode?: boolean;
        encoding?: BufferEncoding;
        verbose?: boolean;
        bind?: string;
    }

    export type WhoisResult = string | Array<{ server: string; data: string }>;

    export type WhoisCallback = (err: Error | null, result?: WhoisResult) => void;

    export function lookup(addr: string, options: WhoisOptions, done: WhoisCallback): void;
    export function lookup(addr: string, done: WhoisCallback): void;
}
