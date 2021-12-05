import { formatCode as fc, formatBold as fb } from "../telegram/index.ts";
import { z, ZodError } from "https://deno.land/x/zod@v3.11.6/mod.ts";
import { InActions, OutActions, inActions, outActions } from "./actions.ts";
import { Player, PlayerId } from "./player.ts";
import { Table, TableId } from "./table.ts";
import { Tile } from "./tile/index.ts";
import { fieldSizeHalf } from "./field.ts";

const putTileDataSchema = z.object({
    position: z.object({
        x: z.number().int().min(-fieldSizeHalf).max(fieldSizeHalf),
        y: z.number().int().min(-fieldSizeHalf).max(fieldSizeHalf),
    }),
    rotation: z.optional(z.number().int().min(0).max(3)).default(0),
    meeple: z.optional(z.number().int().min(0).max(13)).default(0),
});

export type PutTileData = z.infer<typeof putTileDataSchema>;

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
        action: z.infer<typeof OutActions>,
        options?: {
            about?: Player;
            tile?: Tile;
            raw?: Record<string, unknown>;
        }
    ) => {
        let tile;
        if (options?.tile) {
            tile = {
                type: options.tile.type.id + 1,
                seed: options.tile.seed,
            };
            if (action !== outActions.TILE_DRAWN) {
                tile = {
                    ...tile,
                    ...{
                        position: options.tile.position,
                        rotation: options.tile.rotation,
                        meeple: options.tile.meeple?.placeId ?? 0,
                    },
                };
            }
        }
        const playerId = options?.about?.id;
        const message = JSON.stringify({
            action,
            playerId,
            tile,
            ...options?.raw,
        });
        notify.socket.send(message);
        const aboutText = options?.about ? ` by ${fb(options?.about.id)}` : "";
        log(`To ${fb(notify.id)}${aboutText}:\n${fc(message)}`);
    };

    const leaveTable = (player: Player) => {
        const table = player.table;
        if (!table) {
            return undefined;
        }
        player.table = undefined;
        table.players.delete(player);
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.PLAYER_LEFT, { about: player })
        );
        if (table.players.size === 0) {
            removeTable(table);
        }
        return table;
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
            notifyPlayer(toNotify, outActions.PLAYER_JOINED, { about: player })
        );
        table.players.add(player);
    };

    const addTable = (player: Player) => {
        const table = new Table();
        tables.set(table.id, table);
        joinTable(player, table);
        return table;
    };

    const sendTile = (tile: Tile, to: Player) => {
        const table = to.table;
        if (!table) {
            throw new Error("Player has no table");
        }
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.TILE_DRAWN, { tile })
        );
        log(`${fb(to.id)} drawn tile ${tile.type.id + 1}, seed ${tile.seed}`);
    };

    const endGame = (table: Table) => {
        table.game = undefined;
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.GAME_ENDED)
        );
    };

    const startGame = (player: Player) => {
        const table = player.table;
        if (!table) {
            throw new Error("The player has no table to start game on");
        }
        const game = table.startGame();
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.GAME_STARTED, {
                raw: { tiles: 72 },
            })
        );
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.TILE_PUTTED, {
                tile: game.field.get(0, 0),
            })
        );
        if (!game.currentTile) {
            throw new Error("No tiles in deck on game start");
        }
        sendTile(game.currentTile, game.getCurrentPlayer());
    };

    const putTile = (player: Player, tileData: PutTileData) => {
        const table = player.table;
        if (!table) {
            throw new Error("The player has no table put tile on");
        }
        const game = table.game;
        if (!game) {
            throw new Error("Start game firstly");
        }
        const tile = game.putTile(player, tileData);
        [...table.players]
            .filter((x) => x != player)
            .forEach((toNotify) =>
                notifyPlayer(toNotify, outActions.TILE_PUTTED, {
                    about: player,
                    tile,
                })
            );
        if (!game.currentTile) {
            endGame(table);
            return;
        }
        sendTile(game.currentTile, game.getCurrentPlayer());
    };

    const processMessage = (message: string, player: Player) => {
        try {
            const object = JSON.parse(message);
            const actionSchema = z.object({ action: InActions });
            const { action } = actionSchema.parse(object);

            if (action === inActions.PING) {
                return { action: outActions.PONG };
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
                if (!table) {
                    throw new Error("The player has no table to leave");
                }
                return {
                    action: outActions.LEAVE_TABLE_SUCCESS,
                    tableId: table.id,
                };
            }

            if (action === inActions.START_GAME) {
                startGame(player);
                return {
                    action: outActions.NONE,
                };
            }

            if (action === inActions.PUT_TILE) {
                const putTileData = putTileDataSchema.parse(object);
                putTile(player, putTileData);
                return {
                    action: outActions.NONE,
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
