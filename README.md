# OOPProjectServer
Carcassonne

# In actions
## PING
```json
{ "action": "PING" }
```
## CREATE_TABLE
```json
{ "action": "CREATE_TABLE" }
```
## JOIN_TABLE
```json
{
    "action": "JOIN_TABLE",
    "tableId": "TTEST"
}
```
## LEAVE_TABLE
```json
{
    "action": "LEAVE_TABLE",
    "tableId": "TTEST"
}
```
## START_GAME
```json
{ "action": "START_GAME" }
```
## PUT_TILE
```json
{
    "action": "PUT_TILE",
    "position": { "x": 3, "y": 5 },
    "rotation": 1, // default 0
    "meeple": 13 // default 0 = NONE
}
```
# Out actions
## PONG
```json
{ "action": "PONG" }
```
## PLAYER_JOINED
```json
{
    "action":"PLAYER_JOINED",
    "playerId":"PFVWXP"
}
```
## PLAYER_LEFT
```json
{
    "action":"PLAYER_LEFT",
    "playerId":"PFVWXP"
}
```
## CREATE_TABLE_SUCCESS
```json
{
    "action":"CREATE_TABLE_SUCCESS",
    "tableId":"TL081A"
}
```
## JOIN_TABLE_SUCCESS
```json
{
    "action":"JOIN_TABLE_SUCCESS",
    "tableId":"TTEST",
    "players":["PHE8VU","PD5HDB"]
}
```
## JOIN_TABLE_FAILURE
```json
{
    "action":"JOIN_TABLE_FAILURE",
    "tableId":"TNONE"
}
```
## LEAVE_TABLE_SUCCESS
```json
{
    "action":"JOIN_TABLE_FAILURE",
    "tableId":"TNONE"
}
```
## ERROR
```json
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
```json
{"action":"GAME_STARTED"}
```
## GAME_ENDED
```json
{
    "action":"GAME_ENDED"
    // TODO, ещё будут очки игроков
}
```
## TILE_DRAWN
```json
{
    "action": "TILE_DRAWN",
    "tileType": 21
}
```
## TILE_PUTTED
```json
{
    "action": "TILE_PUTTED",
    "tile": {
        "type": 19,
        "position": {
            "x": 0,
            "y": 0
        },
        "rotation": 0,
        "meeple": 5 // id позиции крестьянина если он поставлен
                    // иначе этого поля не будет
    }
}
```
