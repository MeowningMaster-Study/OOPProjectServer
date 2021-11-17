import { formatCode as fc } from "./telegram/index.ts";
import newGame, { PlayerId } from "./game.ts";
import newId from "./idGenerator.ts";

const init = async (port: number, log: (message: string) => void) => {
    const game = newGame(log);
    const players = new Map<WebSocket, PlayerId>();

    const onOpen = (ws: WebSocket, _ev: Event) => {
        const id: PlayerId = "P" + newId();
        players.set(ws, id);
        game.addPlayer(id);
    };

    const onClose = (ws: WebSocket, _ev: CloseEvent) => {
        const id = players.get(ws);
        if (!id) {
            log(`Missing ${fc(id)}`);
            return;
        }
        players.delete(ws);
        game.removePlayer(id);
    };

    const onError = (ws: WebSocket, ev: Event | ErrorEvent) => {
        const id = players.get(ws);
        log(
            `Error ${fc(id)}:\n` +
                (ev instanceof ErrorEvent ? ev.message : ev.type)
        );
    };

    const onMessage = async (ws: WebSocket, ev: MessageEvent) => {
        const id = players.get(ws);
        if (!id) {
            log(`Missing ${fc(id)}`);
            return;
        }
        const data = ev.data;
        const rawResult = await game.processMessage(data, id);
        let result;
        if (typeof rawResult === "object") {
            result = JSON.stringify(rawResult);
        } else {
            result = String(rawResult);
        }
        ws.send(result);
        log(`${fc(id)}:\n` + data + "\nResponse:\n" + result);
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
