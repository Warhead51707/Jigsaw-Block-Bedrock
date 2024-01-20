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
        name: "minecraft:empty",
        targetName: "minecraft:empty",
        turnsInto: "minecraft:air",
        jointType: "rollable",
        chosenStructure: "minecraft:empty",
        facingDirection: placeJigsaw.block.permutation.getState("minecraft:cardinal_direction") as string,
        calibrated: false,
        childStructureRotation: "null",
        childId: "null",
        keep: false,
        parent: false
    }

    dataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))

    // world.sendMessage(placeJigsaw.block.permutation.getState("minecraft:cardinal_direction") as string)
    // world.sendMessage(placeJigsaw.block.permutation.getState("minecraft:facing_direction") as string)
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