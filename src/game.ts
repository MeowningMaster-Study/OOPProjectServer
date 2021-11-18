import { formatCode as fc, formatBold as fb } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z, ZodError } from "https://deno.land/x/zod@v3.11.6/mod.ts";
import { InActions, OutActions, inActions, outActions } from "./gameActions.ts";

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

    // for tests
    {
        const table = new Table();
        table.id = "TTEST";
        tables.set(table.id, table);
    }

    const addPlayer = (player: Player) => {
        players.set(player.id, player);
        log(`${fb(player.id)} connected`);
    };

    const removeTable = (table: Table) => {
        tables.delete(table.id);
        log(`${fb(table.id)} destructed`);
    };

    const notifyPlayer = (
        notify: Player,
        about: Player,
        action: z.infer<typeof OutActions>
    ) => {
        const message = JSON.stringify({
            action,
            playerId: about.id,
        });
        notify.socket.send(message);
        log(`To ${fb(notify.id)}:\n${fc(message)}`);
    };

    const leaveTable = (player: Player) => {
        const table = player.table;
        if (table) {
            player.table = undefined;
            table.players.delete(player);
            table.players.forEach((toNotify) =>
                notifyPlayer(toNotify, player, outActions.PLAYER_LEFT)
            );
            if (table.players.size === 0) {
                removeTable(table);
            }
            return table;
        }
        return undefined;
    };

    const removePlayer = (player: Player) => {
        leaveTable(player);
        players.delete(player.id);
        log(`${fb(player.id)} disconnected`);
    };

    const joinTable = (player: Player, table: Table) => {
        leaveTable(player);
        player.table = table;
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, player, outActions.PLAYER_JOINED)
        );
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
            const actionSchema = z.object({ action: InActions });
            const { action } = actionSchema.parse(object);

            if (action === inActions.PING) {
                return { action: outActions };
            }

            if (action === inActions.CREATE_TABLE) {
                const table = addTable(player);
                return {
                    action: outActions.CREATE_TABLE_SUCCESS,
                    tableId: table.id,
                };
            }

            if (action === inActions.JOIN_TABLE) {
                const tableSchema = z.object({ tableId: z.string() });
                const { tableId } = tableSchema.parse(object);
                const table = tables.get(tableId);
                if (table) {
                    joinTable(player, table);
                    return {
                        action: outActions.JOIN_TABLE_SUCCESS,
                        tableId,
                        players: [...table.players].map((player) => player.id),
                    };
                }
                return {
                    action: outActions.JOIN_TABLE_FAILURE,
                    tableId: tableId,
                };
            }

            if (action === inActions.LEAVE_TABLE) {
                const table = leaveTable(player);
                if (table) {
                    return {
                        action: outActions.LEAVE_TABLE_SUCCESS,
                        tableId: table.id,
                    };
                }
                return {
                    action: outActions.LEAVE_TABLE_FAILURE,
                };
            }

            throw `No action handler ${action}`;
        } catch (e) {
            let description;
            if (e instanceof Error) {
                if (e instanceof ZodError) {
                    description = e.flatten().fieldErrors;
                } else {
                    description = e.message;
                }
            }
            return { action: outActions.ERROR, description };
        }
    };

    return {
        addPlayer,
        removePlayer,
        processMessage,
    };
};

export default init;
