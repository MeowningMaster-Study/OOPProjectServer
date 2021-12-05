# Tile objects
Used to display the type of completed object in `OBJECT_FINISHED` message
```jsonc
{
    None: 0,
    Road: 1,
    Town: 2,
    Field: 3,
    Monastery: 4
}
```

# Tile structure
```jsonc
{
    // starts from 0 on server and from 1 on front
    "id": 0,

    // 0 - nothing, [1-4] - road, [5-8] - town
    // same numbers connect same objects
    "sides": [5, 5, 5, 1],

    // 0 - nothing, [9-12] - field
    // same numbers connect same fields
    "halves": [0, 0, 0, 0, 0, 0, 9, 10],

    // has monastery
    "monastery": false,

    // has shield on town with id 5
    "shield": false
}
```
