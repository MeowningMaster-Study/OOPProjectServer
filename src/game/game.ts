import { Player, PlayerId } from "./player.ts";
import { Table } from "./table.ts";
import { Tile, getPlaceType, PlaceType } from "./tile/index.ts";
import { tilesTypes, countOfTiles, startingTileType } from "./tile/types.ts";
import { Meeple, playerMeeplesCount } from "./meeple.ts";
import { Field, fieldSizeHalf } from "./field.ts";
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
    currentTile?: Tile;
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
            this.currentTile = undefined;
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
        return meeples[i];
    }

    checkConsistency(tile: Tile) {
        if (!tile.position) {
            throw new Error("No position");
        }

        const { x: bx, y: by } = tile.position;
        const { sides } = tile.borders;
        let nonEmptyCount = 0;
        for (let i = 0; i < sides.length; i += 1) {
            const { x, y } = Tile.getSideOffset(i);
            const placeType = getPlaceType(sides[i]);
            const oppSide = Tile.getOppositeSide(i);
            const tileToCheck = this.field.get(bx + x, by + y);
            if (tileToCheck) {
                nonEmptyCount += 1;
                const placeIdToCheck = tileToCheck.borders.sides[oppSide];
                const placeTypeToCheck = getPlaceType(placeIdToCheck);
                if (placeType !== placeTypeToCheck) {
                    throw new Error("Sides doesn't match");
                }
            }
        }
        if (nonEmptyCount === 0) {
            throw new Error("Tile shouldn't be alone");
        }
    }

    putTile(player: Player, tileData: PutTileData, notifyPlayers: () => void) {
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
        tile.position = tileData.position;
        tile.rotation = tileData.rotation;
        this.checkConsistency(tile);
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
        this.field.set(tile.position.x, tile.position.y, tile);
        notifyPlayers();
        this.checkFinishedObjects(tile);
        this.round++;
        this.drawTile();
        return tile;
    }

    checkFinishedObjects(tile: Tile) {
        if (!tile.position) {
            return;
        }
        const { sides } = tile.borders;
        const { x: bx, y: by } = tile.position;

        for (const ox of [-1, 0, 1]) {
            for (const oy of [-1, 0, 1]) {
                const x = bx + ox,
                    y = by + oy;
                this.checkFinishedMonastery(this.field.get(x, y));
            }
        }

        const placeIds = new Set<number>();
        sides.forEach((id) => {
            if (getPlaceType(id) !== PlaceType.None) {
                placeIds.add(id);
            }
        });

        loopSides: for (const id of placeIds) {
            const place = getPlaceType(id) as PlaceType.Town | PlaceType.Road;
            const checked = new Field(false);
            checked.set(tile.position.x, tile.position.y, true);
            const queue: { x: number; y: number; id: number }[] = [];
            queue.push({ ...tile.position, id });
            let queuePos = queue.length;
            const meeples = new Array<Meeple>();
            if (tile.meeple && tile.meeple.placeId === id) {
                meeples.push(tile.meeple);
            }
            let shields = 0;
            if (id === 5 && tile.type.shield) {
                shields += 1;
            }

            for (let i = 0; i < sides.length; i += 1) {
                if (sides[i] != id) {
                    continue;
                }
                const { x: ox, y: oy } = Tile.getSideOffset(i);
                const x = bx + ox,
                    y = by + oy;
                const tileToCheck = this.field.get(x, y);
                if (!tileToCheck) {
                    continue loopSides;
                }
                const placeIdToCheck =
                    tileToCheck.borders.sides[Tile.getOppositeSide(i)];
                queue.push({ x, y, id: placeIdToCheck });
            }

            for (; queuePos < queue.length; queuePos += 1) {
                const { x: bx, y: by, id } = queue[queuePos];
                const tileq = this.field.get(bx, by);
                checked.set(bx, by, true);
                if (!tileq) {
                    continue loopSides;
                }
                if (!tileq.position) {
                    throw new Error("No tile position");
                }
                if (tileq.meeple && tileq.meeple.placeId === id) {
                    meeples.push(tileq.meeple);
                }
                if (id === 5 && tile.type.shield) {
                    shields += 1;
                }
                const { sides } = tileq.borders;
                for (let i = 0; i < sides.length; i += 1) {
                    if (sides[i] != id) {
                        continue;
                    }
                    const { x: ox, y: oy } = Tile.getSideOffset(i);
                    const x = bx + ox,
                        y = by + oy;
                    if (checked.get(x, y)) continue;
                    const tileToCheck = this.field.get(x, y);
                    if (!tileToCheck) {
                        continue loopSides;
                    }
                    const placeIdToCheck =
                        tileToCheck.borders.sides[Tile.getOppositeSide(i)];
                    queue.push({ x, y, id: placeIdToCheck });
                }
            }

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

            if (maxMeeplesCount === 0) {
                continue loopSides;
            }

            const scores: { playerId: PlayerId; amount: number }[] =
                meeplesCount
                    .filter((x) => x.count === maxMeeplesCount)
                    .map((x) => {
                        const amount =
                            queue.length * (place === PlaceType.Town ? 2 : 1) +
                            shields * 2;
                        if (place === PlaceType.Town) {
                            x.player.scores.towns += amount;
                        } else {
                            x.player.scores.roads += amount;
                        }
                        return {
                            playerId: x.player.id,
                            amount,
                        };
                    });

            const tiles = meeples.map((mep) => {
                if (!mep.tile) {
                    throw new Error("Meeple has now tile data");
                }
                if (!mep.tile.position) {
                    throw new Error("Tile has no position");
                }
                return mep.tile.position;
            });

            // free meeples
            meeples.forEach((mep) => mep.free);

            this.finishObject(this.table, {
                type: place,
                tiles,
                scores,
            });
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

        tile.meeple.owner.scores.monasteries += 9;
        tile.meeple.free();

        this.finishObject(this.table, {
            type: PlaceType.Monastery,
            tiles: [tile.position],
            scores: [{ playerId: tile.meeple.owner.id, amount: 9 }],
        });
    }

    countFinalScores() {
        for (let row = -fieldSizeHalf; row <= fieldSizeHalf; row += 1) {
            for (let col = -fieldSizeHalf; col <= fieldSizeHalf; col += 1) {
                const tile = this.field.get(row, col);
                if (tile) {
                    if (!tile.position) {
                        throw new Error("No tile position");
                    }

                    const meeple = tile.meeple;
                    if (!meeple) {
                        continue;
                    }

                    // count monasteries
                    if (tile.type.monastery) {
                        const { x: bx, y: by } = tile.position;
                        let tilesCount = 0;
                        for (let x = -1; x <= 1; x += 1) {
                            for (let y = -1; y <= 1; y += 1) {
                                if (this.field.get(bx + x, by + y)) {
                                    tilesCount += 1;
                                }
                            }
                        }
                        meeple.owner.scores.monasteries += tilesCount;
                    }

                    // count towns and roads
                    const { sides } = tile.borders;
                    const placeId = meeple.placeId;
                    const place = getPlaceType(placeId) as
                        | PlaceType.Town
                        | PlaceType.Road;
                    const checked = new Field(false);
                    checked.set(tile.position.x, tile.position.y, true);
                    const queue: { x: number; y: number; id: number }[] = [];
                    queue.push({ ...tile.position, id: placeId });
                    let queuePos = queue.length;
                    const meeples = [meeple];
                    let shields = 0;
                    if (placeId === 5 && tile.type.shield) {
                        shields += 1;
                    }

                    for (let i = 0; i < sides.length; i += 1) {
                        if (sides[i] != placeId) {
                            continue;
                        }
                        const { x: bx, y: by } = tile.position;
                        const { x: ox, y: oy } = Tile.getSideOffset(i);
                        const x = bx + ox,
                            y = by + oy;
                        const tileToCheck = this.field.get(x, y);
                        if (!tileToCheck) {
                            continue;
                        }
                        const placeIdToCheck =
                            tileToCheck.borders.sides[Tile.getOppositeSide(i)];
                        queue.push({ x, y, id: placeIdToCheck });
                    }

                    for (; queuePos < queue.length; queuePos += 1) {
                        const { x: bx, y: by, id } = queue[queuePos];
                        const tileq = this.field.get(bx, by);
                        checked.set(bx, by, true);
                        if (!tileq) {
                            continue;
                        }
                        if (!tileq.position) {
                            throw new Error("No tile position");
                        }
                        if (tileq.meeple && tileq.meeple.placeId === id) {
                            meeples.push(tileq.meeple);
                        }
                        if (id === 5 && tile.type.shield) {
                            shields += 1;
                        }
                        const { sides } = tileq.borders;
                        for (let i = 0; i < sides.length; i += 1) {
                            if (sides[i] != id) {
                                continue;
                            }
                            const { x: ox, y: oy } = Tile.getSideOffset(i);
                            const x = bx + ox,
                                y = by + oy;
                            if (checked.get(x, y)) continue;
                            const tileToCheck = this.field.get(x, y);
                            if (!tileToCheck) {
                                continue;
                            }
                            const placeIdToCheck =
                                tileToCheck.borders.sides[
                                    Tile.getOppositeSide(i)
                                ];
                            queue.push({ x, y, id: placeIdToCheck });
                        }
                    }

                    let maxMeeplesCount = 0;
                    const meeplesCount: { player: Player; count: number }[] =
                        [];
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

                    meeplesCount
                        .filter((x) => x.count === maxMeeplesCount)
                        .forEach((x) => {
                            const amount =
                                queue.length *
                                    (place === PlaceType.Town ? 2 : 1) +
                                shields * 2;
                            if (place === PlaceType.Town) {
                                x.player.scores.towns += amount;
                            } else {
                                x.player.scores.roads += amount;
                            }
                        });

                    // free meeples
                    meeples.forEach((mep) => mep.free);
                }
            }
        }
    }
}
