# OOPProjectServer
Carcassonne

# In actions
## PING
```jsonc
{ "action": "PING" }
```
## CREATE_TABLE
```jsonc
{ "action": "CREATE_TABLE" }
```
## JOIN_TABLE
```jsonc
{
    "action": "JOIN_TABLE",
    "tableId": "TTEST"
}
```
## LEAVE_TABLE
```jsonc
{
    "action": "LEAVE_TABLE",
    "tableId": "TTEST"
}
```
## START_GAME
```jsonc
{ "action": "START_GAME" }
```
## PUT_TILE
```jsonc
{
    "action": "PUT_TILE",
    "position": { "x": 3, "y": 5 },
    "rotation": 1, // default 0
    "meeple": 13 // default 0 = NONE
}
```
# Out actions
## PONG
```jsonc
{ "action": "PONG" }
```
## PLAYER_JOINED
```jsonc
{
    "action":"PLAYER_JOINED",
    "playerId":"PFVWXP"
}
```
## PLAYER_LEFT
```jsonc
{
    "action":"PLAYER_LEFT",
    "playerId":"PFVWXP"
}
```
## CREATE_TABLE_SUCCESS
```jsonc
{
    "action":"CREATE_TABLE_SUCCESS",
    "tableId":"TL081A"
}
```
## JOIN_TABLE_SUCCESS
```jsonc
{
    "action":"JOIN_TABLE_SUCCESS",
    "tableId":"TTEST",
    "players":["PHE8VU","PD5HDB"]
}
```
## JOIN_TABLE_FAILURE
```jsonc
{
    "action":"JOIN_TABLE_FAILURE",
    "tableId":"TNONE"
}
```
## LEAVE_TABLE_SUCCESS
```jsonc
{
    "action":"JOIN_TABLE_FAILURE",
    "tableId":"TNONE"
}
```
## ERROR
```jsonc
{
    "action": "ERROR",
    "description": {
        "action": [
            "Invalid enum value. Expected 'PING' | 'CREATE_TABLE' | 'JOIN_TABLE' | 'LEAVE_TABLE' | 'START_GAME' | 'PUT_TILE', received 'JOIN_ABLE'"
        ]
    }
}
```
## GAME_STARTED
```jsonc
{"action":"GAME_STARTED"}
```
## GAME_ENDED
```jsonc
{
    "action":"GAME_ENDED"
    // TODO, ещё будут очки игроков
}
```
## TILE_DRAWN
```jsonc
{
    "action": "TILE_DRAWN",
    "tileType": 21
}
```
## TILE_PUTTED
```jsonc
{
    "action": "TILE_PUTTED",
    "tile": {
        "type": 19,
        "position": {
            "x": 0,
            "y": 0
        },
        "rotation": 0,
        "meeple": 5 // id позиции крестьянина если он поставлен, иначе -1
    }
}
```
