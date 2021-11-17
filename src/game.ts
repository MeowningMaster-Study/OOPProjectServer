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

const init = (
    sockets: Map<PlayerId, WebSocket>,
    log: (message: string) => void
) => {
    /** Кто где сидит */
    const seating = new Map<PlayerId, TableId | undefined>();
    const tables = new Map<TableId, Table>();

    const addPlayer = (playerId: PlayerId) => {
        seating.set(playerId, undefined);
        log(`${fc(playerId)} connected`);
    };

    const removePlayer = (playerId: PlayerId) => {
        const tableId = seating.get(playerId);
        const table = tableId ? tables.get(tableId) : undefined;
        if (table) {
            table.players.delete(playerId);
        }
        seating.delete(playerId);
        log(`${fc(playerId)} disconnected`);
    };

    const joinTable = (playerId: PlayerId, tableId: TableId) => {
        // TODO leave table
        seating.set(playerId, tableId);
        const table = tables.get(tableId);
        if (!table) {
            throw `Missing ${tableId}`;
        }
        table.players.forEach((playerId) => {
            const socket = sockets.get(playerId);
            if (!socket) {
                throw `Missing ${playerId}`;
            }
            socket.send(
                JSON.stringify({
                    action: "NEW_PLAYER",
                    playerId,
                })
            );
        });
        table.players.add(playerId);
        return table.players.values;
    };

    const addTable = (playerId: PlayerId) => {
        const table = new Table();
        tables.set(table.id, table);
        joinTable(playerId, table.id);
        return table;
    };

    const processMessage = (message: string, playerId: PlayerId) => {
        try {
            const object = JSON.parse(message);
            const actionSchema = z.object({ action: z.string() });
            const { action } = actionSchema.parse(object);

            if (action === "CREATE_TABLE") {
                const table = addTable(playerId);
                return {
                    action: "CREATE_TABLE_SUCCESS",
                    tableId: table.id,
                };
            }

            if (action === "CONNECT_TO_TABLE") {
                const tableSchema = z.object({ tableId: z.string() });
                const { tableId } = tableSchema.parse(object);

                const players = joinTable(playerId, tableId);
                return {
                    action: "CONNECT_TO_TABLE_SUCCESS",
                    tableId,
                    players,
                };
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
