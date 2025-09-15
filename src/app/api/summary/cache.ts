import SERVERS from '@/utils_server/servers'

let cache: Record<string, {
    lastChecked: number,
    endpoint: string,
    data?: {
        name: string,
        proto: string,
        table: string,
        state: string,
        since: string,
        info: string
    }[],
    fetching: boolean
}> = Object.fromEntries(Object.entries(SERVERS).map(([key, value]) => [
    value,
    {
        lastChecked: 0,
        endpoint: key,
        fetching: false
    }
]));

export const summaryCache = cache;
