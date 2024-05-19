import { world, system, Dimension, Entity, Vector3 } from "@minecraft/server"
import { JigsawBlockData } from "../types"
import { getMacro, isMacroEnabled } from "../util/macro_utils"

world.afterEvents.playerPlaceBlock.subscribe(placeJigsaw => {
    if (placeJigsaw.block.typeId != "jigsaw:jigsaw_block") return

    const block = placeJigsaw.block
    const permutation = block.permutation

    // player placed flag
    let playerPlacedJigsaws: any = world.getDynamicProperty("jigsaw:player_placed")

    if (playerPlacedJigsaws == undefined) {
        world.setDynamicProperty("jigsaw:player_placed", "[]")
    }

    playerPlacedJigsaws = JSON.parse(world.getDynamicProperty("jigsaw:player_placed") as string)

    playerPlacedJigsaws.push(placeJigsaw.block.location)

    world.setDynamicProperty("jigsaw:player_placed", JSON.stringify(playerPlacedJigsaws))
    ///
    const dimension: Dimension = placeJigsaw.dimension
    const dataEntity: Entity = dimension.spawnEntity("jigsaw:jigsaw_data", {
        x: placeJigsaw.block.location.x + 0.5,
        y: placeJigsaw.block.location.y + 0.5,
        z: placeJigsaw.block.location.z + 0.5
    })
    const blockData: JigsawBlockData = {
        targetPool: "minecraft:empty",
        name: "minecraft:empty",
        targetName: "minecraft:empty",
        turnsInto: "minecraft:air",
        jointType: "rollable",
        placementPriority: 0,
        selectionPriority: 0,
        levels: 20,
        level: 0,
        cardinalDirection: permutation.getState("minecraft:cardinal_direction") as string,
        blockFace: permutation.getState("minecraft:block_face") as string,
        branch: false
    }
    const macro: JigsawBlockData = getMacro(placeJigsaw.player)
    if (macro && isMacroEnabled(placeJigsaw.player)) {
        blockData.targetPool = macro.targetPool
        blockData.name = macro.name
        blockData.targetName = macro.targetName
        blockData.turnsInto = macro.turnsInto
        blockData.jointType = macro.jointType
        blockData.placementPriority = macro.placementPriority
        blockData.selectionPriority = macro.selectionPriority
    }
    dataEntity.setDynamicProperty("jigsawData", JSON.stringify(blockData))
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