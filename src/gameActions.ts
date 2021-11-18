import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export const inActions = z.enum([
    "PING",
    "CREATE_TABLE",
    "JOIN_TABLE",
    "LEAVE_TABLE",
]);

export const outActions = {
    pong: "PONG",
    playerJoined: "PLAYER_JOINED",
    playerLeft: "PLAYER_LEFT",
    createTable: {
        success: "CREATE_TABLE_SUCCESS",
    },
    joinTable: {
        success: "JOIN_TABLE_SUCCESS",
        failure: "JOIN_TABLE_FAILURE",
    },
    leaveTable: {
        success: "LEAVE_TABLE_SUCCESS",
        failure: "LEAVE_TABLE_FAILURE",
    },
    error: "ERROR",
} as const;
