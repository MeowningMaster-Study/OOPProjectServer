import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export const InActions = z.enum([
    "PING",
    "CREATE_TABLE",
    "JOIN_TABLE",
    "LEAVE_TABLE",
    "START_GAME",
    "PUT_TILE",
]);

export const OutActions = z.enum([
    "NONE",
    "PONG",
    "PLAYER_JOINED",
    "PLAYER_LEFT",
    "CREATE_TABLE_SUCCESS",
    "JOIN_TABLE_SUCCESS",
    "JOIN_TABLE_FAILURE",
    "LEAVE_TABLE_SUCCESS",
    "ERROR",
    "GAME_STARTED",
    "GAME_ENDED",
    "TILE_DRAWN",
    "TILE_PUTTED",
]);

export const inActions = InActions.enum;
export const outActions = OutActions.enum;
