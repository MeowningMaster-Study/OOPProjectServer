import { config } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import createLogger from "./telegram.ts";
import serve from "./server.ts";

const { PORT: port, BOT_TOKEN: botToken } = config();
const log = createLogger(botToken);
await serve(Number(port), log);
