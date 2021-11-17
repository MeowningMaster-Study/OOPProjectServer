import { formatCode as fc } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export type PlayerId = string;
type TableId = string;

export class Player {
    id: PlayerId;
    socket: WebSocket;
    table?: Table;

    constructor(socket: WebSocket) {
        this.id = "P" + newId();
        this.socket = socket;
    }
}

class Table {
    id: TableId;
    players: Set<Player>;

    constructor() {
        this.id = "T" + newId();
        this.players = new Set();
    }
}

const init = (log: (message: string) => void) => {
    const players = new Map<PlayerId, Player>();
    const tables = new Map<TableId, Table>();

    const addPlayer = (player: Player) => {
        players.set(player.id, player);
        log(`${fc(player.id)} connected`);
    };

    const leaveTable = (player: Player) => {
        const table = player.table;
        if (table) {
            table.players.delete(player);
            table.players.forEach((otherPlayer) => {
                otherPlayer.socket.send(
                    JSON.stringify({
                        action: "PLAYER_LEFT",
                        playerId: player.id,
                    })
                );
            });
            return table;
        }
        return undefined;
    };

    const removePlayer = (player: Player) => {
        leaveTable(player);
        players.delete(player.id);
        log(`${fc(player.id)} disconnected`);
    };

    const joinTable = (player: Player, table: Table) => {
        leaveTable(player);
        player.table = table;
        table.players.forEach((otherPlayer) => {
            otherPlayer.socket.send(
                JSON.stringify({
                    action: "PLAYER_JOINED",
                    playerId: player.id,
                })
            );
        });
        table.players.add(player);
        return [...table.players];
    };

    const addTable = (player: Player) => {
        const table = new Table();
        tables.set(table.id, table);
        joinTable(player, table);
        return table;
    };

    const processMessage = (message: string, player: Player) => {
        try {
            const object = JSON.parse(message);
            const actionSchema = z.object({ action: z.string() });
            const { action } = actionSchema.parse(object);

            if (action === "CREATE_TABLE") {
                const table = addTable(player);
                return {
                    action: "CREATE_TABLE_SUCCESS",
                    tableId: table.id,
                };
            }

            if (action === "JOIN_TABLE") {
                const tableSchema = z.object({ tableId: z.string() });
                const { tableId } = tableSchema.parse(object);
                const table = tables.get(tableId);
                if (table) {
                    const players = joinTable(player, table);
                    return {
                        action: "JOIN_TABLE_SUCCESS",
                        tableId,
                        players,
                    };
                }
                return {
                    action: "JOIN_TABLE_FAILURE",
                    tableId: tableId,
                };
            }

            if (action === "LEAVE_TABLE") {
                const table = leaveTable(player);
                if (table) {
                    return {
                        action: "LEAVE_TABLE_SUCCESS",
                        tableId: table.id,
                    };
                }
                return {
                    action: "LEAVE_TABLE_FAILURE",
                };
            }

            throw `Unknown action ${action}`;
        } catch (e) {
            log(`Error ${fc(player.id)}:\n${JSON.stringify(e)}`);
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
