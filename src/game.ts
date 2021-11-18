import { formatCode as fc } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";
import { inActions, outActions } from "./gameActions.ts";

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
                        action: outActions.playerLeft,
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
                    action: outActions.playerJoined,
                    playerId: player.id,
                })
            );
        });
        table.players.add(player);
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

            if (action === inActions.ping) {
                return { action: outActions.pong };
            }

            if (action === inActions.createTable) {
                const table = addTable(player);
                return {
                    action: outActions.createTable.success,
                    tableId: table.id,
                };
            }

            if (action === inActions.joinTable) {
                const tableSchema = z.object({ tableId: z.string() });
                const { tableId } = tableSchema.parse(object);
                const table = tables.get(tableId);
                if (table) {
                    joinTable(player, table);
                    return {
                        action: outActions.joinTable.success,
                        tableId,
                        players: [...table.players].map((player) => player.id),
                    };
                }
                return {
                    action: outActions.joinTable.failure,
                    tableId: tableId,
                };
            }

            if (action === inActions.leaveTable) {
                const table = leaveTable(player);
                if (table) {
                    return {
                        action: outActions.leaveTable.success,
                        tableId: table.id,
                    };
                }
                return {
                    action: outActions.leaveTable.failure,
                };
            }

            throw `Unknown action ${action}`;
        } catch (e) {
            if (e instanceof Error) {
                return { action: outActions.error, description: e.message };
            }
            return { action: outActions.error, description: JSON.stringify(e) };
        }
    };

    return {
        addPlayer,
        removePlayer,
        processMessage,
    };
};

export default init;
