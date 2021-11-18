import { z } from "https://deno.land/x/zod@v3.11.6/mod.ts";

export const inActionsZod = z.enum([
    "PING",
    "CREATE_TABLE",
    "JOIN_TABLE",
    "LEAVE_TABLE",
]);

const outActionsZod = z.enum([
    "PONG",
    "PLAYER_JOINED",
    "PLAYER_LEFT",
    "CREATE_TABLE_SUCCESS",
    "JOIN_TABLE_SUCCESS",
    "JOIN_TABLE_FAILURE",
    "LEAVE_TABLE_SUCCESS",
    "LEAVE_TABLE_FAILURE",
    "ERROR",
]);

export const inActions = inActionsZod.enum;
export const outActions = outActionsZod.enum;
