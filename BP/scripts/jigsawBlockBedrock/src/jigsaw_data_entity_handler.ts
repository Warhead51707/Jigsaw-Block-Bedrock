import { world, system, Dimension, Entity } from "@minecraft/server"
import { JigsawBlockData } from "./types"

world.afterEvents.playerPlaceBlock.subscribe(placeJigsaw => {
    if (placeJigsaw.block.typeId != "jigsaw:jigsaw_block") return;

    const dimension: Dimension = placeJigsaw.dimension

    const dataEntity: Entity = dimension.spawnEntity("jigsaw:jigsaw_data", {
        x: placeJigsaw.block.location.x + 0.5,
        y: placeJigsaw.block.location.y + 0.5,
        z: placeJigsaw.block.location.z + 0.5
    })

    const jigsawData: JigsawBlockData = {
        targetPool: "minecraft:empty",
        name: "jigsaw:tests/stronghold/base/room",
        targetName: "jigsaw:tests/stronghold/base/room",
        turnsInto: "minecraft:cobbled_deepslate",
        jointType: "rollable",
        orientation: placeJigsaw.block.permutation.getState("jigsaw:orientation") as string,
        keep: true,
        branch: false
    }

    dataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))
})

world.beforeEvents.playerBreakBlock.subscribe(breakJigsaw => {
    if (breakJigsaw.block.typeId != "jigsaw:jigsaw_block") return;

    const dimension: Dimension = breakJigsaw.dimension

    const dataEntity: Entity = dimension.getEntitiesAtBlockLocation(breakJigsaw.block.location)[0]

    if (dataEntity == undefined) return

    system.run(() => {
        dataEntity.remove()
    })
})