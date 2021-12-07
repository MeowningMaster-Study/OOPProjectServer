import { getRandomInt } from "../../utils.ts";
import { Meeple } from "../meeple.ts";

export enum PlaceType {
    None,
    Road,
    Town,
    Field,
    Monastery,
}

export const getPlaceType = (placeId: number) => {
    if (placeId === 0) {
        return PlaceType.None;
    }
    if (placeId >= 1 && placeId <= 4) {
        return PlaceType.Road;
    }
    if (placeId >= 5 && placeId <= 8) {
        return PlaceType.Town;
    }
    if (placeId >= 9 && placeId <= 12) {
        return PlaceType.Field;
    }
    if (placeId === 13) {
        return PlaceType.Monastery;
    }
    throw new Error("Incorrect meeple place type");
};

type TileBorders = {
    sides: number[];
    halves: number[];
};

export type TileType = {
    id: number;
    monastery: boolean;
    shield: boolean;
} & TileBorders;

export class Tile {
    position?: { x: number; y: number };
    type: TileType;
    borders: TileBorders;
    _rotation = 0;
    meeple?: Meeple;
    seed: number;
    closedTownIds: number[] = [];

    constructor(type: TileType) {
        this.type = type;
        this.borders = this.getBorders();
        this.seed = getRandomInt(-2_147_483_648, 2_147_483_647);
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(x: number) {
        this._rotation = x;
        this.borders = this.getBorders();
    }

    getBorders(): TileBorders {
        const sides = new Array<number>(4);
        {
            let p = this.rotation;
            for (let i = 0; i < 4; i += 1) {
                sides[p] = this.type.sides[i];
                p = (p + 1) % 4;
            }
        }

        const halves = new Array<number>(8);
        {
            let p = this.rotation * 2;
            for (let i = 0; i < 8; i += 1) {
                halves[p] = this.type.halves[i];
                p = (p + 1) % 8;
            }
        }

        return { sides, halves };
    }

    static getOppositeSide(side: number) {
        return (side + 2) % 4;
    }

    static getOppositeField(field: number) {
        return (field + 4) % 8;
    }

    static getSideOffset(side: number): { x: number; y: number } {
        if (side === 0) {
            return { x: -1, y: 0 };
        }
        if (side === 1) {
            return { x: 0, y: 1 };
        }
        if (side === 2) {
            return { x: 1, y: 0 };
        }
        if (side === 3) {
            return { x: 0, y: -1 };
        }
        throw new Error("Incorrect side");
    }

    static getFieldOffset(field: number): { x: number; y: number } {
        if ([0, 1].includes(field)) {
            return { x: -1, y: 0 };
        }
        if ([2, 3].includes(field)) {
            return { x: 0, y: 1 };
        }
        if ([4, 5].includes(field)) {
            return { x: 1, y: 0 };
        }
        if ([6, 7].includes(field)) {
            return { x: 0, y: -1 };
        }
        throw new Error("Incorrect side");
    }
}
