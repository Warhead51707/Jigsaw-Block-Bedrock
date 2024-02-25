import { world, system, Dimension, Entity } from "@minecraft/server"
import { JigsawBlockData, JigsawMacroData } from "./types"
import { getMacroData } from "./jigsaw_macro"

world.afterEvents.playerPlaceBlock.subscribe(placeJigsaw => {
    if (placeJigsaw.block.typeId != "jigsaw:jigsaw_block") return;

    const dimension: Dimension = placeJigsaw.dimension

    const dataEntity: Entity = dimension.spawnEntity("jigsaw:jigsaw_data", {
        x: placeJigsaw.block.location.x + 0.5,
        y: placeJigsaw.block.location.y + 0.5,
        z: placeJigsaw.block.location.z + 0.5
    })

    let jigsawMacroData: JigsawMacroData = {
        macroEnabled: true,
        macroOwner: placeJigsaw.player.name,
        targetPool: "minecraft:empty",
        name: "minecraft:empty",
        targetName: "minecraft:empty",
        turnsInto: "minecraft:air",
        jointType: "rollable",
        keep: true
    }

    const macroData: JigsawMacroData[] = getMacroData()

    if (macroData.length != 0) {
        for (const macro of macroData) {
            if (macro.macroOwner == placeJigsaw.player.name && macro.macroEnabled) jigsawMacroData = macro

            break
        }
    } else macroData.push(jigsawMacroData)

    const jigsawData: JigsawBlockData = {
        targetPool: jigsawMacroData.targetPool,
        name: jigsawMacroData.name,
        targetName: jigsawMacroData.targetName,
        turnsInto: jigsawMacroData.turnsInto,
        jointType: jigsawMacroData.jointType,
        cardinalDirection: placeJigsaw.block.permutation.getState("minecraft:cardinal_direction") as string,
        blockFace: placeJigsaw.block.permutation.getState("minecraft:block_face") as string,
        keep: jigsawMacroData.keep,
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