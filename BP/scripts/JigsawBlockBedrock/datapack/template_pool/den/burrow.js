const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 65,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/den/burrow/burrow_stairs",
                processors: "minecraft:empty"
            }
        },
        {
            weight: 35,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "rigid",
                location: "jigsaw:tests/den/burrow/burrow_hall",
                processors: "minecraft:empty"
            }
        }
    ]
}

export default templatePool