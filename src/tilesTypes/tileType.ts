enum PlaceType {
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
};

export type TileType = {
    id: number;
    sides: number[];
    halves: number[];
    monastery: boolean;
    shield: boolean;
};
