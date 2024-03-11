const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 2,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/castle/walls/side_wall",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 1,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/castle/walls/corner_1",
                processors: "minecraft:empty"
            }
        }
    ]
}

export default templatePool