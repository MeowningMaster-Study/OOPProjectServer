import { config } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import createLogger from "./telegram.ts";
import serve from "./server.ts";

config();
const { PORT: port, BOT_TOKEN: botToken } = Deno.env.toObject();
const log = createLogger(botToken);
await serve(Number(port), log);
