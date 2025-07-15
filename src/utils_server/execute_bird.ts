export async function executeBirdCommand(command: string, server: string): Promise<Response> {
    const response = await fetch(new URL(`/bird?q=${encodeURIComponent(command)}`, "http://" + server));

    if (!response.ok) {
        throw new Error('Failed to execute command');
    }

    return response
}

export async function executeTraceroute(target: string, server: string): Promise<Response> {
    const response = await fetch(new URL(`/traceroute?q=${encodeURIComponent(target)}`, "http://" + server));

    if (!response.ok) {
        throw new Error('Failed to execute traceroute');
    }

    return response;
}
