import { formatCode as fc } from "./telegram/index.ts";

const init = async (port: number, log: (message: string) => void) => {
    const usersIds = new Map<WebSocket, string>();

    const onOpen = (ws: WebSocket, _ev: Event) => {
        const id = "U" + crypto.randomUUID();
        usersIds.set(ws, id);
        log(`Opened ${fc(id)}`);
    };

    const onClose = (ws: WebSocket, _ev: CloseEvent) => {
        const id = usersIds.get(ws);
        usersIds.delete(ws);
        log(`Closed ${fc(id)}`);
    };

    const onError = (ws: WebSocket, ev: Event | ErrorEvent) => {
        const id = usersIds.get(ws);
        log(
            `Error ${fc(id)}:\n` +
                (ev instanceof ErrorEvent ? ev.message : ev.type)
        );
    };

    const onMessage = (ws: WebSocket, ev: MessageEvent) => {
        const id = usersIds.get(ws);
        const data = ev.data;
        log(`${fc(id)}:\n` + data);
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
