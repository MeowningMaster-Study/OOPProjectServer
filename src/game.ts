import { formatCode as fc } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export type PlayerId = string;
type TableId = string;
class Table {
    id: TableId;
    players: Set<PlayerId>;

    constructor() {
        this.id = "T" + newId();
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

    const joinTable = (playerId: PlayerId, tableId: TableId) => {
        // leave table
        players.set(playerId, tableId);
        const table = tables.get(tableId);
        if (!table) {
            throw `Missing ${tableId}`;
        }
        table.players.add(playerId);
    };

    const addTable = (playerId: PlayerId) => {
        const table = new Table();
        tables.set(table.id, table);
        joinTable(playerId, table.id);
        return table;
    };

    const processMessage = async (message: string, playerId: PlayerId) => {
        try {
            const object = JSON.parse(message);
            const actionSchema = z.object({ action: z.string() });
            const { action } = actionSchema.parse(object);

            if (action === "CREATE_TABLE") {
                const table = addTable(playerId);
                return { action: "CREATE_TABLE_SUCCESS", data: table };
            }

            if (action === "CONNECT_TO_TABLE") {
                return await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ action: "CONNECT_TO_TABLE_SUCCESS" });
                    }, 3000);
                });

                const tableSchema = z.object({ tableId: z.string() });
                const { tableId } = tableSchema.parse(object);
                joinTable(playerId, tableId);
            }

            throw `Unknown action ${action}`;
        } catch (e) {
            log(`Error: ${JSON.stringify(e)}`);
            return { action: "ERROR" };
        }
    };

    return {
        addPlayer,
        removePlayer,
        processMessage,
    };
};

export default init;
