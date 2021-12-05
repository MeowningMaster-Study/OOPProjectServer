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

export type TileType = {
    id: number;
    sides: number[];
    halves: number[];
    monastery: boolean;
    shield: boolean;
};

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
