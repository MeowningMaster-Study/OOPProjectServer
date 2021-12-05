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

        // check sides
        const { sides } = tile.borders;
        const placeIds = new Set<number>();
        sides.forEach((id) => {
            if (getPlaceType(id) !== PlaceType.None) {
                placeIds.add(id);
            }
        });

        for (const id of placeIds) {
            const placeType = getPlaceType(id) as
                | PlaceType.Town
                | PlaceType.Road;
            const checked = new Field(false);
            const tiles: { x: number; y: number }[] = [
                { x: tile.position.x, y: tile.position.y },
            ];
            const meeples = new Array<Meeple>();
            if (tile.meeple) {
                meeples.push(tile.meeple);
            }
            let shieldsCount = 0;
            let fail = false;

            const checkTile = (x: number, y: number, id: number) => {
                if (fail) return;
                if (checked.get(x, y)) return;
                checked.set(x, y, true);
                for (let i = 0; i < sides.length; i += 1) {
                    if (sides[i] === id) {
                        const { x, y } = Tile.getSideOffset(i);
                        const tile = this.field.get(bx + x, by + y);
                        if (!tile) {
                            fail = true;
                            return;
                        }
                        const oppSide = Tile.getOppositeSide(i);
                        const oppPlaceId = tile.borders.sides[oppSide];
                        if (placeType !== getPlaceType(oppPlaceId)) {
                            fail = true;
                            return;
                        }
                        if (!tile.position) {
                            throw new Error("No tile position");
                        }
                        if (placeType === PlaceType.Town) {
                            if (tile.type.shield) {
                                shieldsCount += 1;
                            }
                        }
                        tiles.push({ x: tile.position.x, y: tile.position.y });
                        if (tile.meeple) {
                            meeples.push(tile.meeple);
                        }
                        checkTile(bx + x, by + y, oppPlaceId);
                    }
                }
            };

            let maxMeeplesCount = 0;
            const meeplesCount: { player: Player; count: number }[] = [];
            this.players.forEach((player) => {
                let count = 0;
                meeples.forEach((meeple) => {
                    if (meeple.owner === player) {
                        count += 1;
                    }
                });

                if (maxMeeplesCount < count) maxMeeplesCount = count;
                meeplesCount.push({ player: player, count });
            });

            const scores: { playerId: PlayerId; amount: number }[] =
                meeplesCount
                    .filter((x) => x.count === maxMeeplesCount)
                    .map((x) => {
                        return {
                            playerId: x.player.id,
                            amount:
                                tiles.length *
                                    (placeType === PlaceType.Road ? 1 : 2) +
                                shieldsCount * 2,
                        };
                    });

            checkTile(bx, by, id);
            if (!fail) {
                this.finishObject(this.table, {
                    type: placeType,
                    tiles,
                    scores,
                });
            }
        }
    }

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
