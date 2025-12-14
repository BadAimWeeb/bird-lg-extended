import { lookup } from "whois";
import type { WhoisOptions, WhoisResult } from "whois";
import { isIPv4, isIPv6 } from "net";
import { Address4, Address6 } from "ip-address";

function lookupAsync<T extends boolean = false>(addr: string, options?: WhoisOptions<T>): Promise<WhoisResult<T>> {
    return new Promise<WhoisResult<T>>((resolve, reject) => {
        lookup(addr, options || {}, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

let cache: Record<string, Promise<{
    lastCached: number,
    data: string
}> | undefined> = {}

export const whoisCache = cache;

const CLASS_A_PRIVATE = new Address4("10.0.0.0/8");
const CLASS_B_PRIVATE = new Address4("172.16.0.0/12");
const IPV6_DN42_ULA_RANGE = new Address6("fd00::/8");

export async function getWhoisWithCache(resource: string) {
    // Check cache
    if (cache[resource]) {
        const cached = await cache[resource];
        if (Date.now() - cached.lastCached < 5 * 60 * 1000) { // 5 minutes
            return cached;
        } else {
            cache[resource] = undefined; // Invalidate cache
        }
    }

    cache[resource] = new Promise<{
        lastCached: number,
        data: string
    }>(async (resolve, reject) => {
        let returned = false;
        // Fallback timeout to prevent hanging
        setTimeout(() => {
            if (!returned) {
                reject(new Error('Timeout while fetching WHOIS data'));
                cache[resource] = undefined;
            }
        }, 31000);

        try {
            switch (process.env.WHOIS_FALLBACK_SPLIT_MODE) {
                case "dn42": {
                    let shouldRedirectOutsideDN42 = false;
                    if (isIPv4(resource)) {
                        // Outside A-class and B-class private ranges should go to public WHOIS
                        const addr = new Address4(resource);
                        if (!CLASS_A_PRIVATE.isInSubnet(addr) && !CLASS_B_PRIVATE.isInSubnet(addr)) {
                            shouldRedirectOutsideDN42 = true;
                        }
                    } else if (isIPv6(resource)) {
                        const addr = new Address6(resource);
                        if (!IPV6_DN42_ULA_RANGE.isInSubnet(addr)) {
                            shouldRedirectOutsideDN42 = true;
                        }
                    } else if (resource.match(/^AS\d+$/)) {
                        // Outside DN42 ASNs (private range including 32-bit range) should go to public WHOIS
                        const asnNumber = parseInt(resource.slice(2), 10);
                        if (!(64512 <= asnNumber && asnNumber <= 65534) && !(4200000000 <= asnNumber && asnNumber <= 4294967294)) {
                            shouldRedirectOutsideDN42 = true;
                        }
                    }

                    if (shouldRedirectOutsideDN42 && process.env.FALLBACK_WHOIS_SERVER) {
                        // Directly use fallback WHOIS server
                        const data = await lookupAsync(resource, {
                            timeout: 15000,
                            punycode: true,
                            server: process.env.FALLBACK_WHOIS_SERVER === "default" ? undefined : process.env.FALLBACK_WHOIS_SERVER
                        });

                        resolve({
                            lastCached: Date.now(),
                            data: data as string
                        });

                        setTimeout(() => {
                            cache[resource] = undefined; // Invalidate cache after 5 minutes
                        }, 5 * 60 * 1000);
                    } else {
                        // Try normal WHOIS server first, then fallback if "% 404" is detected, or error occurs
                        const data = await lookupAsync(resource, {
                            timeout: 15000,
                            punycode: true,
                            server: process.env.WHOIS_SERVER
                        })
                            .then(d => {
                                if (d.includes("% 404")) {
                                    throw new Error("Redirect to fallback WHOIS server due to % 404 response");
                                }

                                return d;
                            })
                            .catch(() => lookupAsync(resource, {
                                timeout: 15000,
                                punycode: true,
                                server: process.env.FALLBACK_WHOIS_SERVER === "default" ? undefined : process.env.FALLBACK_WHOIS_SERVER
                            }));

                        resolve({
                            lastCached: Date.now(),
                            data: data as string
                        });

                        setTimeout(() => {
                            cache[resource] = undefined; // Invalidate cache after 5 minutes
                        }, 5 * 60 * 1000);
                    }
                    break;
                }

                default: {
                    const data = await lookupAsync(resource)
                        .catch((e) => {
                            if (process.env.FALLBACK_WHOIS_SERVER) {
                                // Try fallback server
                                return lookupAsync(resource, {
                                    timeout: 15000,
                                    punycode: true,
                                    server: process.env.FALLBACK_WHOIS_SERVER === "default" ? undefined : process.env.FALLBACK_WHOIS_SERVER
                                });
                            } else {
                                throw e;
                            }
                        });
                    resolve({
                        lastCached: Date.now(),
                        data: data as string
                    });

                    setTimeout(() => {
                        cache[resource] = undefined; // Invalidate cache after 5 minutes
                    }, 5 * 60 * 1000);
                }
            }
        } finally {
            returned = true;
        }
    }).catch(e => {
        cache[resource] = undefined;
        throw e;
    });

    return cache[resource];
}
