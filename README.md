# OOPProjectServer
Carcassonne

# In actions
## PING
```
{ "action": "PING" }
```
## CREATE_TABLE
```
{ "action": "CREATE_TABLE" }
```
## JOIN_TABLE
```
{
    "action": "JOIN_TABLE",
    "tableId": "TTEST"
}
```
## START_GAME
```
{ "action": "START_GAME" }
```
## PUT_TILE
```
{
    "action": "PUT_TILE",
    "position": { "x": 3, "y": 5 },
    "rotation": 1, // default 0
    "meeple": 13 // default 0 = NONE
}
```
# Out actions
## PONG
```
{ "action": "PONG" }
```
## PLAYER_JOINED
## PLEYER_LEFT
## CREATE_TABLE_SUCCESS
## JOIN_TABLE_SUCCESS
## JOIN_TABLE_FAILURE
## LEAVE_TABLE_SUCCESS
## ERROR
## GAME_STARTED
## GAME_ENDED
## TILE_DRAWN
## TILE_PUTTED
