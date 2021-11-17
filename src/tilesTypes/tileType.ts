enum IdType {
    None,
    Road,
    Town,
    Field,
    Monastery,
}

export const getIdType = (id: number) => {
    if (id === 0) {
        return IdType.None;
    }
    if (id >= 1 && id <= 4) {
        return IdType.Road;
    }
    if (id >= 5 && id <= 8) {
        return IdType.Town;
    }
    if (id >= 9 && id <= 12) {
        return IdType.Field;
    }
    if (id === 13) {
        return IdType.Monastery;
    }
};

export type TileType = {
    sides: number[];
    halves: number[];
    monastery: boolean;
    shield: boolean;
};
