export const fieldSizeHalf = 71;
export const fieldSize = fieldSizeHalf * 2 + 1;

export class Field<T> {
    data: T[][];

    constructor(initial: T) {
        this.data = Array.from({ length: fieldSize }, () =>
            new Array(fieldSize).fill(initial)
        );
    }

    get(x: number, y: number) {
        return this.data[x + fieldSizeHalf][y + fieldSizeHalf];
    }

    set(x: number, y: number, data: T) {
        this.data[x + fieldSizeHalf][y + fieldSizeHalf] = data;
    }
}
