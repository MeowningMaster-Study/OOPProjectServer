import { newId } from "../utils.ts";
import { Table } from "./table.ts";

export type PlayerId = string;

export class Player {
    id: PlayerId;
    socket: WebSocket;
    table?: Table;

    constructor(socket: WebSocket) {
        this.id = "P" + newId();
        this.socket = socket;
    }
}
