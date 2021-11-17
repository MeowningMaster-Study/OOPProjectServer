import log from "./telegram.ts";

const env = Deno.env.toObject();
const port = Number(env.PORT) || 8000;

const onOpen = (_ev: Event) => {
    log("Socket opened");
};

const onClose = (_ev: CloseEvent) => {
    log("Socket closed");
};

const onError = (ev: Event | ErrorEvent) => {
    log(ev instanceof ErrorEvent ? ev.message : ev.type);
};

const onMessage = (ws: WebSocket, data: string) => {
    log("CLIENT >> " + data);
    if (data === "exit") {
        return ws.close();
    }
    ws.send(data);
};

const listener = Deno.listen({ port });
console.log(`Waiting for clients on ${port}`);

for await (const conn of listener) {
    const httpConn = Deno.serveHttp(conn);
    for await (const { request: req, respondWith: res } of httpConn) {
        if (req.headers.get("upgrade") != "websocket") {
            res(new Response("Carcassone server is running"));
            continue;
        }
        const { socket: ws, response } = Deno.upgradeWebSocket(req);
        ws.onopen = onOpen;
        ws.onmessage = (m) => onMessage(ws, m.data);
        ws.onclose = onClose;
        ws.onerror = onError;
        res(response);
    }
}
