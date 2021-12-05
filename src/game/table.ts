import { newId } from "../utils.ts";
import { Player } from "./player.ts";
import { Game } from "./game.ts";

export type TableId = string;

export class Table {
    id: TableId;
    players: Set<Player>;
    game?: Game;

    constructor() {
        this.id = "T" + newId();
        this.players = new Set();
    }

    startGame() {
        this.game = new Game([...this.players]);
        return this.game;
    }
}
