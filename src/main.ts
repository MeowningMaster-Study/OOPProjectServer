import "https://deno.land/x/dotenv@v3.1.0/load.ts";
import createLogger from "./telegram/index.ts";
import serve from "./server.ts";

const { PORT: port, BOT_TOKEN: botToken } = Deno.env.toObject();
const log = createLogger(botToken);
await serve(Number(port), log);
