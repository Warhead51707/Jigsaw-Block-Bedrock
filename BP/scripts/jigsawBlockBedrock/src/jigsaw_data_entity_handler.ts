import { world, system, Dimension, Entity, Vector3 } from "@minecraft/server"
import { JigsawBlockData, JigsawMacroData } from "./types"
import { getMacroData } from "./jigsaw_macro"

world.afterEvents.playerPlaceBlock.subscribe(placeJigsaw => {
    if (placeJigsaw.block.typeId != "jigsaw:jigsaw_block") return

    // player placed flag
    let playerPlacedJigsaws: Vector3[] = world.getDynamicProperty("jigsaw:player_placed") as any

    if (playerPlacedJigsaws == undefined) {
        world.setDynamicProperty("jigsaw:player_placed", JSON.stringify([], null, 4))

        playerPlacedJigsaws = JSON.parse(world.getDynamicProperty("jigsaw:player_placed") as string)
    } else playerPlacedJigsaws = JSON.parse(world.getDynamicProperty("jigsaw:player_placed") as string)

    playerPlacedJigsaws.push(placeJigsaw.block.location)

    world.setDynamicProperty("jigsaw:player_placed", JSON.stringify(playerPlacedJigsaws, null, 4))
    ///

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
        jointType: "rollable"
    }

    const macroData: JigsawMacroData[] = JSON.parse(world.getDynamicProperty("jigsaw:macro_data") as string)

    if (macroData.length != 0) {
        for (const macro of macroData) {
            if (macro.macroOwner == placeJigsaw.player.name && macro.macroEnabled) {
                jigsawMacroData = macro
                break
            }
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
        branch: false
    }

    dataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))
})

world.beforeEvents.playerBreakBlock.subscribe(breakJigsaw => {
    if (breakJigsaw.block.typeId != "jigsaw:jigsaw_block") return

    const playerPlacedJigsaws: Vector3[] = JSON.parse(world.getDynamicProperty("jigsaw:player_placed") as string)

    try {
        playerPlacedJigsaws.splice(playerPlacedJigsaws.indexOf(breakJigsaw.block.location), 1)
    } catch {
        console.warn("§dJigsaw Block Bedrock§r (§4Error§r): Failed to remove player placed jigsaw data")
    }

    const dimension: Dimension = breakJigsaw.dimension

    const dataEntity: Entity = dimension.getEntitiesAtBlockLocation(breakJigsaw.block.location)[0]

    if (dataEntity == undefined) return

    system.run(() => {
        dataEntity.remove()
    })
})