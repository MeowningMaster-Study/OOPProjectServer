import { newId } from "../utils.ts";
import { Player } from "./player.ts";
import { Field } from "./field.ts";

export type TableId = string;

export class Table {
    id: TableId;
    players: Set<Player>;
    field?: Field;

    constructor() {
        this.id = "T" + newId();
        this.players = new Set();
    }

    startGame() {
        this.field = new Field([...this.players]);
        return this.field;
    }
}
