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

    export interface WhoisOptions<T extends boolean = false> {
        server?: string | WhoisServer;
        proxy?: string | WhoisProxy;
        timeout?: number;
        follow?: number;
        punycode?: boolean;
        encoding?: BufferEncoding;
        verbose?: T;
        bind?: string;
    }

    export type WhoisResult<T extends boolean = false> = T extends false ? string : Array<{ server: string; data: string }>;

    export type WhoisCallback<T extends boolean = false> = ((err: Error) => void) | ((err: null, data: WhoisResult<T>) => void);

    export function lookup<T extends boolean = false>(addr: string, options: WhoisOptions<T>, done: WhoisCallback<T>): void;
    export function lookup(addr: string, done: WhoisCallback): void;
}
