import { newId } from "../utils.ts";
import { Player } from "./player.ts";
import { Game, FinishObjectFunc } from "./game.ts";

export type TableId = string;

export class Table {
    id: TableId;
    players: Set<Player>;
    game?: Game;

    constructor() {
        this.id = "T" + newId();
        this.players = new Set();
    }

    startGame(finishObject: FinishObjectFunc) {
        this.game = new Game(this, finishObject);
        return this.game;
    }
}
