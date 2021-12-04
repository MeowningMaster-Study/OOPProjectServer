import newId from "./idGenerator.ts";
import { getRandomInt } from "./utils.ts";
import { TileType, getPlaceType, PlaceType } from "./tilesTypes/tileType.ts";
import {
    tilesTypes,
    countOfTiles,
    firstTileType,
} from "./tilesTypes/tilesTypes.ts";
import { PutTileData } from "./eventHandler.ts";

export type PlayerId = string;
export type TableId = string;

export class Player {
    id: PlayerId;
    socket: WebSocket;
    table?: Table;

    constructor(socket: WebSocket) {
        this.id = "P" + newId();
        this.socket = socket;
    }
}

export class Tile {
    position?: { x: number; y: number };
    type: TileType;
    rotation = 0;
    meeple?: Meeple;
    seed: number;

    constructor(type: TileType) {
        this.type = type;
        this.seed = getRandomInt(-2_147_483_648, 2_147_483_647);
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

export const maxFieldHalfSize = 72;
const maxFieldSize = maxFieldHalfSize * 2;
class Game {
    round = 0;
    players: Player[];
    field: (Tile | undefined)[][];
    deck: Tile[];
    meeples: Map<Player, Meeple[]>;
    currentTile: Tile;

    constructor(players: Player[]) {
        this.players = players;
        this.field = Array.from({ length: maxFieldSize }, () =>
            new Array(maxFieldSize).fill(undefined)
        );
        this.meeples = new Map(
            players.map((player) => [
                player,
                Array.from(
                    { length: meeplesCountByPlayer },
                    () => new Meeple(player)
                ),
            ])
        );
        this.deck = countOfTiles.flatMap((count, i) =>
            Array.from({ length: count }, () => new Tile(tilesTypes[i]))
        );
        this.currentTile = new Tile(firstTileType);
        this.currentTile.position = { x: 0, y: 0 };
        this.setTile(0, 0, this.currentTile);
        this.drawTile();
    }

    getTile(x: number, y: number) {
        return this.field[x + maxFieldHalfSize][y + maxFieldHalfSize];
    }

    setTile(x: number, y: number, tile: Tile) {
        this.field[x + maxFieldHalfSize][y + maxFieldHalfSize] = tile;
    }

    getCurrentPlayer() {
        return this.players[this.round % this.players.length];
    }

    drawTile() {
        if (this.deck.length === 0) {
            return undefined;
        }
        const i = Math.floor(Math.random() * this.deck.length);
        this.currentTile = this.deck[i];
        this.deck.splice(i, 1);
    }

    findFreeMeeple(player: Player) {
        const meeples = this.meeples.get(player);
        if (!meeples) {
            throw new Error("The player has no meeples");
        }
        let i = 0;
        for (; i < meeples.length; i++) {
            if (!meeples[i].tile) {
                break;
            }
        }
        if (i === meeples.length) {
            return undefined;
        }
        const meeple = meeples[i];
        meeples.splice(i, 1);
        return meeple;
    }

    putTile(player: Player, tileData: PutTileData) {
        if (player !== this.getCurrentPlayer()) {
            throw new Error("Wait for your turn");
        }
        const tile = this.currentTile;
        if (!tile) {
            throw new Error("No tile to put");
        }
        if (this.getTile(tileData.position.x, tileData.position.y)) {
            throw new Error("This place on field is already taken");
        }
        const meeplePlace = getPlaceType(tileData.meeple);
        if (meeplePlace !== PlaceType.None) {
            const meeple = this.findFreeMeeple(player);
            if (!meeple) {
                throw new Error("The player has no free meeples");
            }
            meeple.placeId = tileData.meeple;
            meeple.tile = tile;
            tile.meeple = meeple;
        }
        tile.position = tileData.position;
        tile.rotation = tileData.rotation;
        this.setTile(tileData.position.x, tileData.position.y, tile);
        this.round++;
        this.drawTile();
        return tile;
    }
}

export class Table {
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
