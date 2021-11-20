import { formatCode as fc, formatBold as fb } from "./telegram/index.ts";
import newId from "./idGenerator.ts";
import { z, ZodError } from "https://deno.land/x/zod@v3.11.6/mod.ts";
import { InActions, OutActions, inActions, outActions } from "./gameActions.ts";
import { TileType } from "./tilesTypes/tileType.ts";
import { tilesTypes, countOfTiles } from "./tilesTypes/tilesTypes.ts";

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

class Tile {
    position?: [number, number];
    type: TileType;
    rotation = 0;

    constructor(type: TileType) {
        this.type = type;
    }
}

const meeplesCountByPlayer = 7;
class Meeple {
    owner: Player;
    tile?: Tile;
    placeId = 0;

    constructor(owner: Player) {
        this.owner = owner;
    }
}

const maxFieldSize = 72 * 2;
class Game {
    round = 0;
    players: Player[];
    field: (Tile | undefined)[][];
    deck: Tile[];
    meeples: Map<Player, Meeple[]>;

    constructor(players: Player[]) {
        this.players = players;
        this.field = new Array(maxFieldSize).map(() =>
            new Array(maxFieldSize).fill(undefined)
        );
        this.meeples = new Map(
            players.map((player) => [
                player,
                new Array(meeplesCountByPlayer).map(() => new Meeple(player)),
            ])
        );
        this.deck = countOfTiles.flatMap((count, i) =>
            new Array(count).map(() => new Tile(tilesTypes[i]))
        );
    }

    getCurrentPlayer() {
        return this.players[this.round % this.players.length];
    }

    drawTile() {
        if (this.deck.length === 0) {
            return undefined;
        }
        const i = Math.floor(Math.random() * this.deck.length);
        const tile = this.deck[i];
        this.deck.splice(i, 1);
        return tile;
    }

    putTile(player: Player, tile: Tile) {
        if (player !== this.getCurrentPlayer()) {
            throw "Wait for your turn!";
        }
        // todo put tile on field
        this.round++;
    }
}

class Table {
    id: TableId;
    players: Set<Player>;
    game?: Game;

    constructor() {
        this.id = "T" + newId();
        this.players = new Set();
    }

    startGame() {
        this.game = new Game([...this.players]);
        return this.game;
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
        action: z.infer<typeof OutActions>,
        about?: Player,
        tile?: Tile
    ) => {
        // todo tile
        const playerId = about?.id;
        const message = JSON.stringify({
            action,
            playerId,
        });
        notify.socket.send(message);
        const aboutText = about ? `by ${fb(about.id)}` : "";
        log(`To ${fb(notify.id)}${aboutText}:\n${fc(message)}`);
    };

    const leaveTable = (player: Player) => {
        const table = player.table;
        if (!table) {
            throw new Error("The player has no table to leave");
        }
        player.table = undefined;
        table.players.delete(player);
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.PLAYER_LEFT, player)
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
            notifyPlayer(toNotify, outActions.PLAYER_JOINED, player)
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
        const message = {
            action: outActions.DRAW_TILE,
            tileType: tile.type.id,
        };
        to.socket.send(JSON.stringify(message));
    };

    const endGame = (table: Table) => {
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
        const tile = game.drawTile();
        if (!tile) {
            endGame(table);
            return;
        }
        sendTile(tile, game.getCurrentPlayer());
        return;
    };

    const putTile = (player: Player, tile: Tile) => {
        const table = player.table;
        if (!table) {
            throw new Error("The player has no table put tile on");
        }
        const game = table.game;
        if (!game) {
            throw new Error("Start game firtly");
        }
        game.putTile(player, tile);
        table.players.forEach((toNotify) =>
            notifyPlayer(toNotify, outActions.PUT_TILE, player, tile)
        );
        const nextTile = game.drawTile();
        if (!nextTile) {
            endGame(table);
            return;
        }
        sendTile(nextTile, game.getCurrentPlayer());
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
                return {
                    action: outActions.LEAVE_TABLE_SUCCESS,
                    tableId: table.id,
                };
            }

            if (action === inActions.START_GAME) {
                startGame(player);
            }

            if (action === inActions.PUT_TILE) {
                // todo get tile from message
                putTile(player, new Tile(tilesTypes[0]));
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
