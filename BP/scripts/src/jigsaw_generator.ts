import { world, system, Dimension, Entity, Block, Vector3 } from "@minecraft/server"
import { JigsawBlockData, TemplatePool, TemplatePoolElement } from "./types"
import { templatePools } from "../datapack/template_pools"
import { weightedRandom } from "./jigsaw_math"

world.afterEvents.entityLoad.subscribe(jigsawDataLoad => {
    if (jigsawDataLoad.entity.typeId != "jigsaw:jigsaw_data") return

    const jigsawDataEntity: Entity = jigsawDataLoad.entity
    const jigsawData: JigsawBlockData = JSON.parse(jigsawDataEntity.getDynamicProperty("jigsawData") as string)

    if (jigsawData.keep) return

    const dimension: Dimension = jigsawDataEntity.dimension

    const jigsawBlock: Block = dimension.getBlock(jigsawDataEntity.location)

    let parentJigsawEntity: Entity
    let parentJigsawBlock: Block
    let parentJigsawData: JigsawBlockData


    for (const loadedJigsaw of dimension.getEntities({
        type: "jigsaw:jigsaw_data"
    })) {
        const loadedJigsawData: JigsawBlockData = JSON.parse(loadedJigsaw.getDynamicProperty("jigsawData") as string)

        if (!loadedJigsawData.parent) continue

        if (loadedJigsaw.id == jigsawDataEntity.id) continue

        //world.sendMessage(`Parent Attempt Child ID: ${loadedJigsawData.childId}`)

        if (loadedJigsawData.childId != "null") continue

        if (loadedJigsawData.targetName == jigsawData.name) {
            parentJigsawEntity = loadedJigsaw

            parentJigsawBlock = dimension.getBlock(loadedJigsaw.location)
            parentJigsawData = loadedJigsawData

            parentJigsawData.facingDirection = dimension.getBlock(loadedJigsaw.location).permutation.getState("minecraft:cardinal_direction") as string

            parentJigsawData.childId = jigsawDataEntity.id

            parentJigsawEntity.setDynamicProperty("jigsawData", JSON.stringify(parentJigsawData, null, 4))

            world.sendMessage(`Parent found: ${parentJigsawEntity.id}, of child: ${jigsawDataEntity.id}, with calibration: ${parentJigsawData.childStructureRotation}`)

            break
        }


    }

    //Empty target
    if (jigsawData.targetPool != "minecraft:empty") {
        const foundTargetPool: TemplatePool = templatePools.find(pool => pool.id == jigsawData.targetPool)

        if (foundTargetPool == undefined) {
            world.sendMessage("Warning - Bad target pool")
            return
        }

        const chosenStruct: TemplatePoolElement = weightedRandom(foundTargetPool.elements)

        jigsawData.chosenStructure = chosenStruct.element.location

        jigsawData.parent = true

        jigsawDataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))

        dimension.runCommand(`structure load "${chosenStruct.element.location}" ${jigsawDataEntity.location.x} ${jigsawDataEntity.location.y} ${jigsawDataEntity.location.z} 0_degrees none true false`)

        return
    }

    // Calibrated child spawn
    if (parentJigsawEntity != undefined && parentJigsawData.calibrated) {
        let difference: Vector3 = {
            x: jigsawDataEntity.location.x - parentJigsawEntity.location.x,
            y: jigsawDataEntity.location.y - parentJigsawEntity.location.y,
            z: jigsawDataEntity.location.z - parentJigsawEntity.location.z
        }

        if (parentJigsawData.facingDirection == "north") difference.z++
        if (parentJigsawData.facingDirection == "east") difference.x--
        if (parentJigsawData.facingDirection == "south") difference.z--
        if (parentJigsawData.facingDirection == "west") difference.x++

        jigsawDataEntity.teleport({
            x: parentJigsawEntity.location.x - difference.x,
            y: parentJigsawEntity.location.y - difference.y,
            z: parentJigsawEntity.location.z - difference.z
        })

        world.sendMessage(`${jigsawDataEntity.location.x}, ${jigsawDataEntity.location.y}, ${jigsawDataEntity.location.z}`)
        world.sendMessage(`${difference.x}, ${difference.y}, ${difference.z}`)
        world.sendMessage(`${parentJigsawEntity.location.x}, ${parentJigsawEntity.location.y}, ${parentJigsawEntity.location.z}`)

        dimension.getBlock({
            x: parentJigsawEntity.location.x,
            y: parentJigsawEntity.location.y + 6,
            z: parentJigsawEntity.location.z
        }).setType("minecraft:sea_lantern")

        dimension.getBlock({
            x: jigsawDataEntity.location.x,
            y: jigsawDataEntity.location.y + 6,
            z: jigsawDataEntity.location.z
        }).setType("minecraft:glowstone")

        dimension.spawnEntity("minecraft:armor_stand", jigsawDataEntity.location)

        world.sendMessage(parentJigsawData.childStructureRotation)

        dimension.runCommand(`structure load "${parentJigsawData.chosenStructure}" ${jigsawDataEntity.location.x} ${jigsawDataEntity.location.y} ${jigsawDataEntity.location.z} ${parentJigsawData.childStructureRotation}`)

        parentJigsawBlock.setType(parentJigsawData.turnsInto)
        parentJigsawEntity.remove()

        jigsawDataEntity.remove()

        return
    }

    // Calibrate child for rotation
    if (parentJigsawEntity != undefined) {

        let structureRotation: string = "0_degrees"

        if (jigsawData.facingDirection == "north") {
            if (parentJigsawData.facingDirection == "north") structureRotation = "180_degrees"
            if (parentJigsawData.facingDirection == "east") structureRotation = "270_degrees"
            if (parentJigsawData.facingDirection == "west") structureRotation = "90_degrees"
            if (parentJigsawData.facingDirection == "south") structureRotation = "0_degrees"
        }

        if (jigsawData.facingDirection == "east") {
            if (parentJigsawData.facingDirection == "north") structureRotation = "90_degrees"
            if (parentJigsawData.facingDirection == "east") structureRotation = "180_degrees"
            if (parentJigsawData.facingDirection == "west") structureRotation = "0_degrees"
            if (parentJigsawData.facingDirection == "south") structureRotation = "270_degrees"
        }

        if (jigsawData.facingDirection == "west") {
            if (parentJigsawData.facingDirection == "north") structureRotation = "270_degrees"
            if (parentJigsawData.facingDirection == "east") structureRotation = "0_degrees"
            if (parentJigsawData.facingDirection == "west") structureRotation = "180_degrees"
            if (parentJigsawData.facingDirection == "south") structureRotation = "90_degrees"
        }

        if (jigsawData.facingDirection == "south") {
            if (parentJigsawData.facingDirection == "north") structureRotation = "0_degrees"
            if (parentJigsawData.facingDirection == "east") structureRotation = "90_degrees"
            if (parentJigsawData.facingDirection == "west") structureRotation = "270_degrees"
            if (parentJigsawData.facingDirection == "south") structureRotation = "180_degrees"
        }

        dimension.runCommand(`structure load "${parentJigsawData.chosenStructure}" ${parentJigsawEntity.location.x} ${parentJigsawEntity.location.y} ${parentJigsawEntity.location.z} ${structureRotation} none true false`)

        parentJigsawData.calibrated = true
        parentJigsawData.childStructureRotation = structureRotation

        parentJigsawData.childId = "null"

        parentJigsawEntity.setDynamicProperty("jigsawData", JSON.stringify(parentJigsawData, null, 4))

        jigsawDataEntity.remove()

        return
    }
    // Empty yigsaw
    if (jigsawData.targetPool == "minecraft:empty") {
        jigsawDataEntity.remove()
        jigsawBlock.setType(jigsawData.turnsInto)
        return
    }
})