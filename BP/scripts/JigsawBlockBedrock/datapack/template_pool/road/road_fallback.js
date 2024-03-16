const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 1,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/road/road_fallback",
                processors: "minecraft:empty"
            }
        }
    ]
}

export default templatePool