import { formatCode as fc, formatBold as fb } from "./telegram/index.ts";
import newGame, { Player } from "./game.ts";
import { outActions } from "./gameActions.ts";

const init = async (port: number, log: (message: string) => void) => {
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
            log(`Missing ${fb(player)}`);
            return;
        }
        players.delete(ws);
        game.removePlayer(player);
    };

    const onError = (ws: WebSocket, ev: Event | ErrorEvent) => {
        const player = players.get(ws);
        log(
            `Error ${fb(player?.id)}:\n` +
                (ev instanceof ErrorEvent ? ev.message : ev.type)
        );
    };

    const onMessage = (ws: WebSocket, ev: MessageEvent) => {
        const player = players.get(ws);
        if (!player) {
            log(`Missing ${fb(player)}`);
            return;
        }
        const data = ev.data;
        const result = game.processMessage(data, player);

        let responseText = "";
        if (result.action !== outActions.NONE) {
            const stringResult = JSON.stringify(result);
            ws.send(stringResult);
            if (result.action === outActions.PONG) {
                return;
            }
            responseText = `\nResponse:\n${fc(stringResult)}`;
        }
        log(`${fb(player.id)}:\n${fc(data)}${responseText}`);
    };

    const listener = Deno.listen({ port });
    log(`Waiting for clients on ${port}`);

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
