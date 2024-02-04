import { world, system, Dimension, Entity, Block, Vector3 } from "@minecraft/server"
import { JigsawBlockData, TemplatePool, TemplatePoolElement, StructureGenerationData, StructureGenerationDataStructure, PositiveNegativeCorners, PlacementResult, Bounds } from "./types"
import { templatePools } from "../datapack/template_pools"
import { weightedRandom, boundsIntersect } from "./jigsaw_math"

async function waitTick() {
    await new Promise<void>(res => {
        system.run(res)
    })
}

const queue: { [key: string]: { name: string, bounds: Bounds, resolve: () => void, loading: boolean } } = {}
let nextQueueId = 0

async function placeStructureSafe(name: string, bounds: Bounds) {
    const task: any = { name, bounds, loading: false }

    const promise = new Promise(resolve => {
        task.resolve = resolve
    })

    const id = nextQueueId
    nextQueueId++

    queue[id] = task

    await promise
}

world.afterEvents.worldInitialize.subscribe(event => {
    system.runInterval(() => {
        const loadedBounds = Object.values(queue).filter(otherItem => otherItem.loading).map(otherItem => otherItem.bounds)

        for (const id of Object.keys(queue)) {
            const queueItem = queue[id]

            if (queueItem.loading) continue

            let canLoad = true

            for (const otherBounds of loadedBounds) {
                if (!boundsIntersect(queueItem.bounds, otherBounds)) continue

                canLoad = false

                break
            }

            if (!canLoad) continue

            loadedBounds.push(queueItem.bounds)
            queueItem.loading = true

            world.sendMessage(`Loading ${queueItem.name}`)

            system.runTimeout(() => {
                delete queue[id]
                queueItem.resolve()
            }, 20)
        }
    }, 1)
})

async function calculatePlacement(source: Entity, targetPool: TemplatePool): Promise<PlacementResult | null> {
    const dimension = source.dimension

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

    const structureSize: string = chosenStructure.element.location.split("-")[1]

    const structureGenDataStructure: StructureGenerationDataStructure = {
        location: {
            x: entity.location.x - offset.x,
            y: entity.location.y - offset.y,
            z: entity.location.z - offset.z
        },
        size: {
            length: structureSize.split("_").map(Number)[0],
            width: structureSize.split("_").map(Number)[1],
            height: structureSize.split("_").map(Number)[2]
        }
    }

    let collide: boolean = false

    for (let structure of structureGenerationData.structures) {
        if (structureCollideCheck(structureGenDataStructure, structure)) {
            collide = true
            break
        }
    }

    if (collide) {
        branchBlock.setType(branchData.turnsInto)

        block.setType(data.turnsInto)

        entity.remove()

        return
    }
}

world.afterEvents.chatSend.subscribe(async event => {
    if (event.message === "test") {
        await placeStructureSafe('test', {
            start: { x: 0, y: 0, z: 0 },
            end: { x: 1, y: 1, z: 1 }
        })

        await placeStructureSafe('test2', {
            start: { x: 0, y: 0, z: 0 },
            end: { x: 1, y: 1, z: 1 }
        })
    }
})

world.afterEvents.entityLoad.subscribe(async event => {
    return

    if (event.entity.typeId !== "jigsaw:jigsaw_data") return

    const entity: Entity = event.entity
    const dimension: Dimension = entity.dimension
    const block: Block = dimension.getBlock(entity.location)

    //This source entity was loaded as part of the calculate stage so it shouldn't execute
    if (block.typeId !== "jigsaw:jigsaw_block") return

    const data: JigsawBlockData = JSON.parse(entity.getDynamicProperty("jigsawData") as string)

    // This is to stop any logic from running for the jigsaw blocks placed in the template structures
    if (data.keep) return

    // This jigsaw has no targetPool to place so we stop here
    if (data.targetPool === "minecraft:empty") return

    const targetPool: TemplatePool = templatePools.find(pool => pool.id == data.targetPool)

    // target pool could not be found, probably user configuration error
    if (targetPool === undefined) {
        world.sendMessage(`Warning - Bad target pool: "${data.targetPool}"`)

        entity.remove()

        return
    }

    const placement = await calculatePlacement(entity, targetPool)

    if (placement === null) {

    }

    await dimension.runCommand(`structure load "${placement.name}" ${placement.position.x} ${placement.position.y} ${placement.position.z} ${placement.rotation}`)
    await waitTick()

    const jigsawStructureNamespace: string = data.targetName.split(":")[0]

    world.setDynamicProperty(`structureGenerationData_${jigsawStructureNamespace}`, JSON.stringify(structureGenerationData, null, 4))

    branchEntity = branchEntities.shift()
    branchData = JSON.parse(branchEntity.getDynamicProperty("jigsawData") as string)
    branchBlock = dimension.getBlock(branchEntity.location)

    branchEntity.remove()

    branchBlock.setType(branchData.turnsInto)

    entity.remove()

    block.setType(data.turnsInto)
})

function getCornerCoordinates(structure: StructureGenerationDataStructure): PositiveNegativeCorners {
    const negativeCorner: Vector3 = {
        x: structure.location.x - structure.size.length / 2,
        y: structure.location.y - structure.size.width / 2,
        z: structure.location.z - structure.size.height / 2
    }

    const positiveCorner: Vector3 = {
        x: structure.location.x + structure.size.length / 2,
        y: structure.location.y + structure.size.width / 2,
        z: structure.location.z + structure.size.height / 2
    }

    return {
        negative: negativeCorner,
        positive: positiveCorner
    }
}

function structureCollideCheck(structure1: StructureGenerationDataStructure, structure2: StructureGenerationDataStructure): boolean {
    const corners1: PositiveNegativeCorners = getCornerCoordinates(structure1)
    const corners2: PositiveNegativeCorners = getCornerCoordinates(structure2)


    const collisionX = corners1.positive.x >= corners2.negative.x && corners1.negative.x <= corners2.positive.x;
    const collisionY = corners1.positive.y >= corners2.negative.y && corners1.negative.y <= corners2.positive.y;
    const collisionZ = corners1.positive.z >= corners2.negative.z && corners1.negative.z <= corners2.positive.z;

    return collisionX && collisionY && collisionZ;
}