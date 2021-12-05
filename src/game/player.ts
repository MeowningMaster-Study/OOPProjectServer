import { newId } from "../utils.ts";
import { Table } from "./table.ts";

export type PlayerId = string;

export type rgb = { r: number; g: number; b: number };

const colorsRaw: [number, number, number][] = [
    [214, 45, 94],
    [231, 123, 85],
    [250, 222, 156],
    [77, 219, 185],
    [142, 139, 235],
];
const colors: rgb[] = colorsRaw.map((col) => {
    return { r: col[0], g: col[1], b: col[2] };
});

export class Player {
    id: PlayerId;
    socket: WebSocket;
    table?: Table;
    scores: 0;
    color: rgb;

    static nextColor = 0;

    constructor(socket: WebSocket) {
        this.id = "P" + newId();
        this.socket = socket;
        this.scores = 0;
        this.color = colors[Player.nextColor];
        Player.nextColor = (Player.nextColor + 1) % colors.length;
    }
}
