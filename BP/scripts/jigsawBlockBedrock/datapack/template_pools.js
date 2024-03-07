export const templatePools = [
    {
        id: "jigsaw:empty",
        fallback: "minecraft:empty",
        elements: [
            {
                weight: 100,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
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
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
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
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
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
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
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
                weight: 30,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/hall/hallway_5_5_15"
                }
            },
            {
                weight: 10,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/main/mainroom_13_6_22"
                }
            },
            {
                weight: 8,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/jailhouse_17_5_18"
                }
            },
            {
                weight: 11,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/passthroughs/pit_11_12_20"
                }
            },
            {
                weight: 18,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/treasure/crafting_9_5_10"
                }
            },
            {
                weight: 14,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/treasure/library_9_5_13"
                }
            },
            {
                weight: 4,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/treasure/oldcake_9_5_9"
                }
            },
            {
                weight: 15,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    processors: "minecraft:empty",
                    location: "jigsaw:tests/stronghold/rooms/treasure/orestorage_9_5_10"
                }
            }
        ]
    },
    {
        id: "dev:road",
        fallback: "minecraft:empty",
        levels: 7,
        elements: [
            {
                weight: 1,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    location: "jigsaw:tests/list_test/roads/road_1_9_1_3",
                    processors: "minecraft:empty"
                }
            },
            {
                weight: 2,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    location: "jigsaw:tests/list_test/roads/road_2_6_1_6",
                    processors: "minecraft:empty"
                }
            },
            {
                weight: 3,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    location: "jigsaw:tests/list_test/roads/road_3_9_1_6",
                    processors: "minecraft:empty"
                }
            },
            {
                weight: 1,
                element: {
                    element_type: "minecraft:list_pool_element",
                    projection: "rigid",
                    elements: [
                        {
                            element_type: "minecraft:single_pool_element",
                            projection: "rigid",
                            location: "jigsaw:tests/list_test/buildings/small_home_9_9_9",
                            processors: "minecraft:empty"
                        },
                        {
                            element_type: "minecraft:single_pool_element",
                            projection: "rigid",
                            location: "jigsaw:tests/list_test/buildings/small_home_test_9_9_9",
                            processors: "minecraft:empty"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: "jigsaw:tests/platforms",
        fallback: "minecraft:empty",
        levels: 5,
        elements: [
            {
                weight: 100,
                element: {
                    element_type: "minecraft:single_pool_element",
                    projection: "rigid",
                    location: "jigsaw:tests/platforms/purpur_platform_3_1_3",
                    processors: "minecraft:empty"
                }
            }
        ]
    }
]