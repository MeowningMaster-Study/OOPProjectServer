import { newId } from "../utils.ts";
import { Player } from "./player.ts";
import { Game, FinishObjectFunc } from "./game.ts";

export type TableId = string;

export class Table {
    id: TableId;
    name: string;
    players: Set<Player>;
    game?: Game;

    constructor(name?: string) {
        this.id = "T" + newId();
        this.name = name ?? this.id;
        this.players = new Set();
    }

    startGame(finishObject: FinishObjectFunc) {
        this.game = new Game(this, finishObject);
        return this.game;
    }
}
