import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import tg from "./telegram.ts";

const env = Deno.env.toObject();
const port = Number(env.PORT) || 8000;

// const onOpen = (_ev: Event) => {
//   tg.sendMessages("Socket opened");
// };

// const onMessage = (ev: MessageEvent) => {
//   tg.sendMessages(`Message: ${ev.data}`);
// };

// const onClose = (_ev: CloseEvent) => {
//   tg.sendMessages("Socket closed");
// };

// const onError = (ev: Event | ErrorEvent) => {
//   if (ev instanceof ErrorEvent) {
//     tg.sendMessages(`Error: ${ev.error}`);
//   }
// };

// const onRequest = (req: Request): Response => {
//   const { socket, response } = Deno.upgradeWebSocket(req);
//   socket.onopen = onOpen;
//   socket.onmessage = onMessage;
//   socket.onclose = onClose;
//   socket.onerror = onError;
//   return response;
// };

// serve(onRequest, { addr: `:${port}` });

// console.log(`port: ${port}`);

const logError = (msg: string) => {
  console.log(msg);
};
const handleConnected = () => console.log("Connected to client ...");
const handleMessage = (ws: WebSocket, data: string) => {
  console.log("CLIENT >> " + data);
  const reply = data;
  if (reply === "exit") return ws.close();
  ws.send(reply as string);
};
const handleError = (e: Event | ErrorEvent) =>
  console.log(e instanceof ErrorEvent ? e.message : e.type);
console.log(`Waiting for clients on ${port}`);
const listener = Deno.listen({ port });
for await (const conn of listener) {
  const httpConn = Deno.serveHttp(conn);
  for await (const { request: req, respondWith: res } of httpConn) {
    if (req.headers.get("upgrade") != "websocket") {
      res(new Response(null, { status: 501 }));
      break;
    }
    const { socket: ws, response } = Deno.upgradeWebSocket(req);
    ws.onopen = () => handleConnected();
    ws.onmessage = (m) => handleMessage(ws, m.data);
    ws.onclose = () => logError("Disconnected from client ...");
    ws.onerror = (e) => handleError(e);
    res(response);
  }
}
