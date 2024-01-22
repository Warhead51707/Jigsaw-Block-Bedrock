import { world, system, Dimension, Entity, Block, Vector3 } from "@minecraft/server"
import { JigsawBlockData, TemplatePool, TemplatePoolElement } from "./types"
import { templatePools } from "../datapack/template_pools"
import { weightedRandom } from "./jigsaw_math"

async function waitTicks(ticks: number) {
    await new Promise<void>(res => {
        system.runTimeout(res, ticks)
    })
}

async function waitTick() {
    await new Promise<void>(res => {
        system.run(res)
    })
}

const branchEntities: Entity[] = []

world.afterEvents.entityLoad.subscribe(async event => {
    if (event.entity.typeId !== "jigsaw:jigsaw_data") return

    const entity: Entity = event.entity
    const data: JigsawBlockData = JSON.parse(entity.getDynamicProperty("jigsawData") as string)

    // This is to stop any logic from running for the jigsaw blocks placed in the template structures, debug purposes
    if (data.keep) return

    // We are a branch jigsaw entity so we track ourselves and skip the code to spawn another branch
    if (data.targetPool === "minecraft:empty") {
        branchEntities.push(entity)

        return
    }

    const dimension: Dimension = entity.dimension
    const block: Block = dimension.getBlock(entity.location)

    const targetPool: TemplatePool = templatePools.find(pool => pool.id == data.targetPool)

    if (targetPool === undefined) {
        world.sendMessage("Warning - Bad target pool")

        return
    }

    const chosenStructure: TemplatePoolElement = weightedRandom(targetPool.elements)

    await dimension.runCommandAsync(`structure load "${chosenStructure.element.location}" ${entity.location.x} ${entity.location.y} ${entity.location.z} 0_degrees none true false`)

    await waitTick()

    let branchEntity = branchEntities.shift()
    let branchData: JigsawBlockData = JSON.parse(branchEntity.getDynamicProperty("jigsawData") as string)
    let branchBlock = dimension.getBlock(branchEntity.location)

    branchEntity.remove()

    const rotation = block.permutation.getState("minecraft:cardinal_direction")

    let targetRotation: string = "0_degrees"

    if (branchData.facingDirection == "north") {
        if (rotation == "north") targetRotation = "180_degrees"
        if (rotation == "east") targetRotation = "270_degrees"
        if (rotation == "west") targetRotation = "90_degrees"
        if (rotation == "south") targetRotation = "0_degrees"
    }

    if (branchData.facingDirection == "east") {
        if (rotation == "north") targetRotation = "90_degrees"
        if (rotation == "east") targetRotation = "180_degrees"
        if (rotation == "west") targetRotation = "0_degrees"
        if (rotation == "south") targetRotation = "270_degrees"
    }

    if (branchData.facingDirection == "west") {
        if (rotation == "north") targetRotation = "270_degrees"
        if (rotation == "east") targetRotation = "0_degrees"
        if (rotation == "west") targetRotation = "180_degrees"
        if (rotation == "south") targetRotation = "90_degrees"
    }

    if (branchData.facingDirection == "south") {
        if (rotation == "north") targetRotation = "0_degrees"
        if (rotation == "east") targetRotation = "90_degrees"
        if (rotation == "west") targetRotation = "270_degrees"
        if (rotation == "south") targetRotation = "180_degrees"
    }

    world.sendMessage(`${branchData.facingDirection} => ${rotation} = ${targetRotation}`)

    await dimension.runCommandAsync(`structure load "${chosenStructure.element.location}" ${entity.location.x} ${entity.location.y} ${entity.location.z} ${targetRotation} none true false`)

    await waitTick()

    branchEntity = branchEntities.shift()
    branchData = JSON.parse(branchEntity.getDynamicProperty("jigsawData") as string)


    let offset: Vector3 = {
        x: branchEntity.location.x - entity.location.x,
        y: branchEntity.location.y - entity.location.y,
        z: branchEntity.location.z - entity.location.z
    }

    branchEntity.remove()

    if (rotation == "north") offset.z++
    if (rotation == "east") offset.x--
    if (rotation == "south") offset.z--
    if (rotation == "west") offset.x++

    offset.y = 0

    await dimension.runCommand(`structure load "${chosenStructure.element.location}" ${entity.location.x - offset.x} ${entity.location.y - offset.y} ${entity.location.z - offset.z} ${targetRotation}`)

    await waitTick()

    branchEntity = branchEntities.shift()
    branchData = JSON.parse(branchEntity.getDynamicProperty("jigsawData") as string)
    branchBlock = dimension.getBlock(branchEntity.location)

    branchEntity.remove()

    branchBlock.setType(branchData.turnsInto)

    entity.remove()

    block.setType(data.turnsInto)
})