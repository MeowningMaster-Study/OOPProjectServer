import { Player } from "./player.ts";
import { Tile, getPlaceType, PlaceType } from "./tile/index.ts";
import { tilesTypes, countOfTiles, startingTileType } from "./tile/types.ts";
import { Meeple, playerMeeplesCount } from "./meeple.ts";
import { PutTileData } from "./eventHandler.ts";

export const fieldSizeHalf = 72;
export const fieldSize = fieldSizeHalf * 2;
export class Game {
    round = 0;
    players: Player[];
    field: (Tile | undefined)[][];
    deck: Tile[];
    meeples: Map<Player, Meeple[]>;
    currentTile: Tile;

    constructor(players: Player[]) {
        this.players = players;
        this.field = Array.from({ length: fieldSize }, () =>
            new Array(fieldSize).fill(undefined)
        );
        this.meeples = new Map(
            players.map((player) => [
                player,
                Array.from(
                    { length: playerMeeplesCount },
                    () => new Meeple(player)
                ),
            ])
        );
        this.deck = countOfTiles.flatMap((count, i) =>
            Array.from({ length: count }, () => new Tile(tilesTypes[i]))
        );
        this.currentTile = new Tile(startingTileType);
        this.currentTile.position = { x: 0, y: 0 };
        this.setTile(0, 0, this.currentTile);
        this.drawTile();
    }

    getTile(x: number, y: number) {
        return this.field[x + fieldSizeHalf][y + fieldSizeHalf];
    }

    setTile(x: number, y: number, tile: Tile) {
        this.field[x + fieldSizeHalf][y + fieldSizeHalf] = tile;
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
