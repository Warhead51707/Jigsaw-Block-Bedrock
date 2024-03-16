const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 65,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/road/road_decoration",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 35,
            element: {
                element_type: "minecraft:empty_pool_element"
            }
        }
    ]
}

export default templatePool