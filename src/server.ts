import { formatCode as fc } from "./telegram/index.ts";
import newGame, { Player, pong } from "./game.ts";

const init = async (port: number, log: (message: string) => void) => {
    log("Server started");
    const players = new Map<WebSocket, Player>();
    const game = newGame(log);

    const onOpen = (ws: WebSocket, _ev: Event) => {
        const player = new Player(ws);
        players.set(ws, player);
        game.addPlayer(player);
    };

    const onClose = (ws: WebSocket, _ev: CloseEvent) => {
        const player = players.get(ws);
        if (!player) {
            log(`Missing ${fc(player)}`);
            return;
        }
        players.delete(ws);
        game.removePlayer(player);
    };

    const onError = (ws: WebSocket, ev: Event | ErrorEvent) => {
        const player = players.get(ws);
        log(
            `Error ${fc(player?.id)}:\n` +
                (ev instanceof ErrorEvent ? ev.message : ev.type)
        );
    };

    const onMessage = (ws: WebSocket, ev: MessageEvent) => {
        const player = players.get(ws);
        if (!player) {
            log(`Missing ${fc(player)}`);
            return;
        }
        const data = ev.data;
        const rawResult = game.processMessage(data, player);
        if (rawResult === pong) {
            ws.send(JSON.stringify(rawResult));
            return;
        }
        let result;
        if (typeof rawResult === "object") {
            result = JSON.stringify(rawResult);
        } else {
            result = String(rawResult);
        }
        ws.send(result);
        log(`${fc(player.id)}:\n` + data + "\nResponse:\n" + result);
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
