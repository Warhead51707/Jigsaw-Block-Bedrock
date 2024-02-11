export const templatePools = [
    {
        id: "jigsaw:tests/stronghold/start",
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
        elements: [
            {
                weight: 35,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/hall/hallway_5_5_15"
                }
            },
            {
                weight: 5,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/main/mainroom_13_6_22"
                }
            },
            {
                weight: 15,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/jailhouse_17_5_18"
                }
            },
            {
                weight: 15,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/pit_11_12_20"
                }
            },
            {
                weight: 13,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/crafting_9_5_10"
                }
            },
            {
                weight: 15,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/library_9_5_13"
                }
            },
            {
                weight: 10,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/oldcake_9_5_9"
                }
            },
            {
                weight: 18,
                element: {
                    location: "jigsaw:tests/stronghold/rooms/treasure/orestorage_9_5_10"
                }
            }
        ]
    }
]