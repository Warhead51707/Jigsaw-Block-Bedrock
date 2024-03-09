const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 1,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/list_test/roads/road_1",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 2,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/list_test/roads/road_2",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 3,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/list_test/roads/road_3",
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
                        location: "jigsaw:tests/list_test/buildings/small_home",
                        processors: "minecraft:empty"
                    },
                    {
                        element_type: "minecraft:single_pool_element",
                        projection: "rigid",
                        location: "jigsaw:tests/list_test/buildings/small_home_test",
                        processors: "minecraft:empty"
                    }
                ]
            }
        }
    ]
}

export default templatePool