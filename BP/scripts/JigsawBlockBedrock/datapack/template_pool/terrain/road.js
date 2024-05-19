const templatePool = {
    fallback: "minecraft:empty",
    elements: [
        {
            weight: 1,
            element: {
                element_type: "minecraft:single_pool_element",
                projection: "terrain_matching",
                location: "jigsaw:tests/terrain/keke",
                processors: "minecraft:empty"
            }
        }
    ]
}

export default templatePool