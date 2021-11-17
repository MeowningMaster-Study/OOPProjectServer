const init = async (port: number, log: (message: string) => void) => {
    const ids = new Map<WebSocket, string>();

    const onOpen = (ws: WebSocket, _ev: Event) => {
        const id = crypto.randomUUID();
        ids.set(ws, id);
        log(`Opened ${id}`);
    };

    const onClose = (ws: WebSocket, _ev: CloseEvent) => {
        const id = ids.get(ws);
        log(`Closed ${id}`);
    };

    const onError = (ws: WebSocket, ev: Event | ErrorEvent) => {
        const id = ids.get(ws);
        log(
            `Error ${id}:\n` + (ev instanceof ErrorEvent ? ev.message : ev.type)
        );
    };

    const onMessage = (ws: WebSocket, ev: MessageEvent) => {
        const id = ids.get(ws);
        const data = ev.data;
        log(`${id}:\n` + data);
        if (data === "exit") {
            return ws.close();
        }
        ws.send(data); // echo
    };

    const listener = Deno.listen({ port });
    console.log(`Waiting for clients on ${port}`);

    for await (const conn of listener) {
        const httpConn = Deno.serveHttp(conn);
        for await (const { request: req, respondWith: res } of httpConn) {
            if (req.headers.get("upgrade") != "websocket") {
                res(new Response("Carcassonne server is running"));
                continue;
            }
            const { socket: ws, response } = Deno.upgradeWebSocket(req);
            ws.onopen = (ev) => onOpen(ws, ev);
            ws.onmessage = (ev) => onMessage(ws, ev);
            ws.onclose = (ev) => onClose(ws, ev);
            ws.onerror = (ev) => onError(ws, ev);
            res(response);
        }
    }
};

export default init;
