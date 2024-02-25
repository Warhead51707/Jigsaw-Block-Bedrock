export const templatePools = [
    {
        id: "jigsaw:empty",
        fallback: "minecraft:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/fallback/wall_3_4_1"
                }
            }
        ]
    },
    {
        id: "jigsaw:tests/stronghold/start",
        fallback: "jigsaw:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/stronghold/start/stairroom_9_9_10"
                }
            }
        ]
    },
    {
        id: "jigsaw:tests/stronghold/staircase",
        fallback: "jigsaw:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/stronghold/start/staircase_6_13_11"
                }
            }
        ]
    },
    {
        id: "jigsaw:tests/stronghold/main_rooms",
        fallback: "jigsaw:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/main/mainroom_13_6_22"
                }
            }
        ]
    },
    {
        id: "jigsaw:tests/stronghold/rooms",
        fallback: "jigsaw:empty",
        elements: [
            {
                weight: 0,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/hall/hallway_5_5_15"
                }
            },
            {
                weight: 50,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/main/mainroom_13_6_22"
                }
            },
            {
                weight: 0,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/jailhouse_17_5_18"
                }
            },
            {
                weight: 0,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/pit_11_12_20"
                }
            },
            {
                weight: 0,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/crafting_9_5_10"
                }
            },
            {
                weight: 5,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/library_9_5_13"
                }
            },
            {
                weight: 8,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/oldcake_9_5_9"
                }
            },
            {
                weight: 5,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/orestorage_9_5_10"
                }
            }
        ]
    },
    {
        id: "example:streets/fallback",
        fallback: "minecraft:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/streets/street_end_5_5_1"
                }
            }
        ]
    },
    {
        id: "example:streets",
        fallback: "example:streets/fallback",
        elements: [
            {
                weight: 50,
                element: {
                    location: "jigsaw:tests/streets/street_1_9_5_9"
                }
            },
            {
                weight: 50,
                element: {
                    location: "jigsaw:tests/streets/street_2_17_5_9"
                }
            }
        ]
    },
    {
        id: "example:streets/decor",
        fallback: "minecraft:empty",
        elements: [
            {
                weight: 100,
                element: {
                    location: "jigsaw:tests/streets/street_side_3_4_3"
                }
            }
        ]
    }
]