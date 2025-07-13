"use server";

import { SERVERS_CLIENT_VIEW } from "./servers";

export async function getServersClientView(): Promise<string[]> {
    return Promise.resolve(SERVERS_CLIENT_VIEW);
}
