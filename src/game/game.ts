import { Player, PlayerId } from "./player.ts";
import { Table } from "./table.ts";
import { Tile, getPlaceType, PlaceType } from "./tile/index.ts";
import { tilesTypes, countOfTiles, startingTileType } from "./tile/types.ts";
import { Meeple, playerMeeplesCount } from "./meeple.ts";
import { Field } from "./field.ts";
import { PutTileData } from "./eventHandler.ts";

export type FinishedObject = {
    type: PlaceType.Road | PlaceType.Town | PlaceType.Monastery;
    tiles: { x: number; y: number }[];
    scores: { playerId: PlayerId; amount: number }[]; // scores per player
};

export type FinishObjectFunc = (table: Table, object: FinishedObject) => void;

export class Game {
    table: Table;
    round = 0;
    players: Player[];
    field: Field<Tile | undefined>;
    deck: Tile[];
    meeples: Map<Player, Meeple[]>;
    currentTile: Tile;
    finishObject: FinishObjectFunc;

    constructor(table: Table, finishObject: FinishObjectFunc) {
        this.table = table;
        this.players = [...table.players];
        this.field = new Field(undefined);
        this.meeples = new Map(
            this.players.map((player) => [
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
        this.finishObject = finishObject;
        this.currentTile = new Tile(startingTileType);
        this.currentTile.position = { x: 0, y: 0 };
        this.field.set(0, 0, this.currentTile);
        this.drawTile();
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
        if (this.field.get(tileData.position.x, tileData.position.y)) {
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
        this.field.set(tileData.position.x, tileData.position.y, tile);
        this.checkFinishedObjects(tile);
        this.round++;
        this.drawTile();
        return tile;
    }

    checkFinishedObjects(tile: Tile) {
        if (!tile.position) {
            return;
        }

        const { x: bx, y: by } = tile.position;

        for (let x = -1; x <= 1; x += 1) {
            for (let y = -1; y <= 1; y += 1) {
                this.checkFinishedMonastery(this.field.get(bx + x, by + y));
            }
        }
    }

    // checkFinishedSide()

    checkFinishedMonastery(tile: Tile | undefined) {
        if (!tile || !tile.position || !tile.meeple || !tile.type.monastery) {
            return;
        }

        const { x: bx, y: by } = tile.position;

        for (let x = -1; x <= 1; x += 1) {
            for (let y = -1; y <= 1; y += 1) {
                if (!this.field.get(bx + x, by + y)) {
                    return;
                }
            }
        }

        this.finishObject(this.table, {
            type: PlaceType.Monastery,
            tiles: [tile.position],
            scores: [{ playerId: tile.meeple.owner.id, amount: 9 }],
        });
    }
}
