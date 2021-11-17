import { formatCode as fc } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export type PlayerId = string;
type TableId = string;
class Table {
    id: TableId;
    players: Set<PlayerId>;

    constructor() {
        this.id = newId();
        this.players = new Set();
    }
}

const init = (log: (message: string) => void) => {
    const players = new Map<PlayerId, TableId | undefined>();
    const tables = new Map<TableId, Table>();

    const addPlayer = (playerId: PlayerId) => {
        players.set(playerId, undefined);
        log(`${fc(playerId)} connected`);
    };

    const removePlayer = (playerId: PlayerId) => {
        const tableId = players.get(playerId);
        const table = tableId ? tables.get(tableId) : undefined;
        if (table) {
            table.players.delete(playerId);
        }
        players.delete(playerId);
        log(`${fc(playerId)} disconnected`);
    };

    const joinTable = (playerId: PlayerId, tableId: TableId) => {};

    const addTable = () => {
        const table = new Table();
        const { id } = table;
        tables.set(id, table);
        return id;
    };

    const processMessage = (message: string, playerId: PlayerId) => {
        const object = JSON.parse(message);
        const { action } = z
            .object({
                action: z.string(),
            })
            .parse(object);

        if (action === "CONNECT_TO_TABLE") {
            return { action: "CONNECT_TO_TABLE_SUCCESS" };
            //joinTable(playerId)
        }
    };

    return {
        addPlayer,
        removePlayer,
        processMessage,
    };
};

export default init;
