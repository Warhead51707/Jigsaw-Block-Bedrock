const templatePool = {
    fallback: "road:road_fallback",
    elements: [
        {
            weight: 55,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/road/road",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 45,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/road/road_turn",
                processors: "minecraft:empty"
            }
        }
    ]
}

export default templatePool