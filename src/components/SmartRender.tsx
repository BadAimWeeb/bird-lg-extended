// This code is converted from bird-lg-go. Thanks to the original authors (xddxdd) for the regex. :)

import Link from "next/link";
import { Link as MUILink } from "@mui/material";

const REGEX_1 = /(\d+)/g;
const REGEX_2 = /([a-zA-Z0-9\-]*\.([a-zA-Z]{2,3}){1,2})(\s|$)/g;
const REGEX_3 = /\[AS(\d+)/g;
const REGEX_4 = /(\d+\.\d+\.\d+\.\d+)/g;
const REGEX_5 = /(([a-f\d]{0,4}:){3,10}[a-f\d]{0,4})/gi;

export function SmartRender({ birdOutput }: { birdOutput: string }) {
    const lines = birdOutput.split('\n');

    const renderedElements: React.ReactNode[] = [];
    
    let unifiedData = "";
    for (const ln in lines) {
        const line = lines[ln];
        const trimmedLine = line.trim();

        let unifiedLine = line;
        if (trimmedLine.startsWith("BGP.as_path:") || trimmedLine.startsWith("Neighbor AS:") || trimmedLine.startsWith("Local AS:")) {
            // Process REGEX_1 only
            unifiedLine = line.replaceAll(REGEX_1, `!!!UNIFIED_TEMPLATE##AS$1##$1!!!`);
        } else {
            // Process REGEX_2 to REGEX_5
            unifiedLine = line
                .replaceAll(REGEX_2, `!!!UNIFIED_TEMPLATE##$1##$1!!!`)
                .replaceAll(REGEX_3, `!!!UNIFIED_TEMPLATE##AS$1##AS$1!!!`)
                .replaceAll(REGEX_4, `!!!UNIFIED_TEMPLATE##$1##$1!!!`)
                .replaceAll(REGEX_5, `!!!UNIFIED_TEMPLATE##$1##$1!!!`);
        }
        
        unifiedData += unifiedLine;
        if (+ln < lines.length - 1) {
            unifiedData += '\n';
        }
    }

    const uTemplate = /!!!UNIFIED_TEMPLATE##(.*?)##(.*?)!!!/g;
    let match;
    let unmatchPointer = 0;
    while ((match = uTemplate.exec(unifiedData)) !== null) {
        const [_, whoisQuery, display] = match;
        const startIndex = match.index;
        const endIndex = uTemplate.lastIndex;

        const beforeMatch = unifiedData.slice(unmatchPointer, startIndex);
        if (beforeMatch) {
            renderedElements.push(beforeMatch);
        }

        renderedElements.push(
            <MUILink component={Link} href={`/whois/${whoisQuery}`} key={`link-${startIndex}`}>
                {display}
            </MUILink>
        );

        unmatchPointer = endIndex;
    }
    const remainingText = unifiedData.slice(unmatchPointer);
    if (remainingText) {
        renderedElements.push(remainingText);
    }

    return <>{renderedElements}</>;
}
