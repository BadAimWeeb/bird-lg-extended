const SERVERS_RAW = process.env.SERVERS || "";
/* Address: Label */
const SERVERS: Record<string, string> = {};
const SERVERS_REVERSE: Record<string, string> = {};

// Read from left to right, mind the ' and " characters to allow spaces and , in labels
if (SERVERS_RAW) {
    let pos = 0;

    const skipWhitespace = () => {
        while (pos < SERVERS_RAW.length && /\s/.test(SERVERS_RAW[pos])) {
            pos++;
        }
    };

    while (pos < SERVERS_RAW.length) {
        skipWhitespace();
        if (pos >= SERVERS_RAW.length) break;

        // Parse address (up to equals or comma)
        const addressStart = pos;
        while (pos < SERVERS_RAW.length && SERVERS_RAW[pos] !== '=' && SERVERS_RAW[pos] !== ',') {
            pos++;
        }

        const address = SERVERS_RAW.substring(addressStart, pos).trim();
        if (!address) {
            // Skip this entry if address is empty
            while (pos < SERVERS_RAW.length && SERVERS_RAW[pos] !== ',') {
                pos++;
            }
            if (pos < SERVERS_RAW.length) pos++; // Skip comma
            continue;
        }

        // Default label is the address itself
        let label = address;

        // Check for label
        if (pos < SERVERS_RAW.length && SERVERS_RAW[pos] === '=') {
            pos++; // Skip equals
            skipWhitespace();

            // Check if we have a quoted label
            if (pos < SERVERS_RAW.length && (SERVERS_RAW[pos] === '"' || SERVERS_RAW[pos] === "'")) {
                const quoteChar = SERVERS_RAW[pos];
                pos++; // Skip opening quote

                let quotedLabel = '';
                while (pos < SERVERS_RAW.length) {
                    // Handle escaped double quotes
                    if (quoteChar === '"' && SERVERS_RAW[pos] === '"' &&
                        pos + 1 < SERVERS_RAW.length && SERVERS_RAW[pos + 1] === '"') {
                        quotedLabel += '"';
                        pos += 2; // Skip both quotes
                    }
                    // End of quoted string
                    else if (SERVERS_RAW[pos] === quoteChar) {
                        pos++; // Skip closing quote
                        break;
                    }
                    // Regular character
                    else {
                        quotedLabel += SERVERS_RAW[pos];
                        pos++;
                    }
                }

                label = quotedLabel;
            } else {
                // Unquoted label
                const labelStart = pos;
                while (pos < SERVERS_RAW.length && SERVERS_RAW[pos] !== ',') {
                    pos++;
                }

                label = SERVERS_RAW.substring(labelStart, pos).trim();
            }
        }

        const [addressWithoutProtocol, port] = address.split(':');

        // Add to SERVERS object
        const kAddress = addressWithoutProtocol + (process.env.DEFAULT_BIRD_LG_DOMAIN ? ("." + process.env.DEFAULT_BIRD_LG_DOMAIN || "") : "") + ":" + (port || process.env.DEFAULT_PROXY_PORT || "8000");
        SERVERS[kAddress] = label;
        SERVERS_REVERSE[label] = kAddress;

        // Skip comma if present
        if (pos < SERVERS_RAW.length && SERVERS_RAW[pos] === ',') {
            pos++;
        }
    }
}

export default SERVERS;
export { SERVERS_REVERSE };
