import { Player } from "./player.ts";
import { Tile } from "./tile/index.ts";
export const playerMeeplesCount = 7;

export class Meeple {
    owner: Player;
    tile?: Tile;
    placeId = 0;

    constructor(owner: Player) {
        this.owner = owner;
    }
}
