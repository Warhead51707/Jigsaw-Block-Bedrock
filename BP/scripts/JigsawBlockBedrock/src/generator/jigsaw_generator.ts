import { world, Dimension, Entity, Block, Vector3, system } from '@minecraft/server'
import { JigsawBlockData, TemplatePool, TemplatePoolElement, PlacementResult, Bounds, StructureBranches, SinglePoolElement, EmptyPoolElement, ListPoolElement, TemplatePoolSubElement } from '../types'
import { templatePools } from '../../datapack/template_pools'
import { weightedRandom, boundsIntersect, boundsFit, randomMinMax, boundsFitsSmaller } from '../util/jigsaw_math'
import { parseSize, getPlacedBounds, addPlacedBounds, PossiblePlacements, shuffle } from '../util/jigsaw_generator_utils'
import { placeStructureAndGetEntities, lockBoundsMutex, unlockBoundsMutex, MutexRequest } from './jigsaw_smart_queue'
import { getTemplatePool, elementWeightedRandom } from '../util/template_pool_utils'

const structureBranchesCache: { [key: string]: StructureBranches } = {}

// Gen start
world.afterEvents.entityLoad.subscribe(async event => {
    if (event.entity.typeId !== 'jigsaw:jigsaw_data') return

    system.runTimeout(() => {
        if (event.entity.lifetimeState === 'Unloaded') return
        if (!event.entity.lifetimeState) return

        const property = event.entity.getDynamicProperty('jigsawData')

        if (typeof property !== 'string') return

        try {
            const block = event.entity.dimension.getBlock(event.entity.location)
            const data = JSON.parse(property) as JigsawBlockData

            // This is a branch so its parent will tell it when to generate
            if (data.branch) return

            // was this jigsaw player placed
            const playerPlacedJigsaws: any[] = JSON.parse(world.getDynamicProperty("jigsaw:player_placed") as string)

            for (const playerPlaced of playerPlacedJigsaws) {
                if (playerPlaced.x == block.location.x && playerPlaced.y == block.location.y && playerPlaced.z == block.location.z) return
            }

            generate(event.entity)
        } catch { }
    }, 3)
})

async function generate(source: Entity) {
    const position: Vector3 = {
        x: Math.floor(source.location.x),
        y: Math.floor(source.location.y),
        z: Math.floor(source.location.z),
    }
    const dimension: Dimension = source.dimension
    const block: Block = dimension.getBlock(position)

    const data: JigsawBlockData = JSON.parse(source.getDynamicProperty('jigsawData') as string)

    source.remove()

    // This jigsaw has no targetPool to place so we stop here
    if (data.targetPool == 'minecraft:empty') {
        block.setType(data.turnsInto)

        return
    }

    let targetPool: TemplatePool = getTemplatePool(data.targetPool)

    if (targetPool == null || targetPool == undefined) {
        block.setType(data.turnsInto)

        return
    }

    let placement = await getPlacement(position, dimension, data, targetPool)

    const targetPoolLevels: number = targetPool.levels == undefined ? 20 : targetPool.levels

    // fallbacks
    while (placement == null || data.level == targetPoolLevels) {
        targetPool = getTemplatePool(targetPool.fallback)

        if (data.level == targetPoolLevels && placement != null) {
            unlockBoundsMutex(placement.mutex)
        }

        if (targetPool == null) {
            block.setType(data.turnsInto)

            return
        }

        placement = await getPlacement(position, dimension, data, targetPool)

    }

    block.setType(data.turnsInto)

    addPlacedBounds(placement.bounds)

    const branchEntities = await placeStructureAndGetEntities(placement.structures[0], placement.position, placement.rotation, false, placement.bounds, dimension)

    for (const branchEntity of shuffle(branchEntities) as Entity[]) {
        if (branchEntity.typeId !== 'jigsaw:jigsaw_data') continue

        const branchData: JigsawBlockData = JSON.parse(branchEntity.getDynamicProperty('jigsawData') as string)

        branchData.branch = true
        branchData.levels = targetPoolLevels
        branchData.level = data.level + 1

        branchEntity.setDynamicProperty('jigsawData', JSON.stringify(branchData))

        if (
            Math.floor(branchEntity.location.x) === placement.connectedPosition.x &&
            Math.floor(branchEntity.location.y) === placement.connectedPosition.y &&
            Math.floor(branchEntity.location.z) === placement.connectedPosition.z
        ) {
            dimension.getBlock(placement.connectedPosition).setType(branchData.turnsInto)

            branchEntity.remove()

            continue
        }

        generate(branchEntity)
    }

    for (let i = 1; i < placement.structures.length; i++) {
        const otherEntities = await placeStructureAndGetEntities(placement.structures[i], placement.position, placement.rotation, false, placement.bounds, dimension)

        for (const otherEntity of otherEntities) {
            const otherEntityBranchData: JigsawBlockData = JSON.parse(otherEntity.getDynamicProperty('jigsawData') as string)

            dimension.getBlock(otherEntity.location).setType(otherEntityBranchData.turnsInto)

            otherEntity.remove()
        }
    }

    unlockBoundsMutex(placement.mutex)
}

export async function getPlacement(position: Vector3, dimension: Dimension, data: JigsawBlockData, targetPool: TemplatePool): Promise<PlacementResult | null> {
    // try {
    const targetPoolElements: TemplatePoolElement[] = JSON.parse(JSON.stringify(targetPool.elements))

    while (targetPoolElements.length > 0) {
        //Template pool logic

        let structuresToPlace: string[] = []

        let chosenStructure: TemplatePoolElement | null = elementWeightedRandom(targetPoolElements)

        if (chosenStructure == null || chosenStructure == undefined) return null

        targetPoolElements.splice(targetPoolElements.indexOf(chosenStructure), 1)

        if (chosenStructure.element.element_type == "minecraft:single_pool_element") {
            structuresToPlace.push((chosenStructure.element as EmptyPoolElement & SinglePoolElement).location)
        }

        if (chosenStructure.element.element_type == "minecraft:list_pool_element") {
            for (const element of (chosenStructure.element as ListPoolElement).elements) {
                structuresToPlace.push((element as EmptyPoolElement & SinglePoolElement).location)
            }
        }

        ///

        const bounds = {
            start: position,
            size: parseSize(structuresToPlace[0]),
        }

        const branches = await getBranches(structuresToPlace[0], position, bounds, dimension)
        const possibleBranches = shuffle(branches.filter(branch => branch.data.name === data.targetName)) as StructureBranches

        const sourceBlockFace = dimension.getBlock(position).permutation.getState('minecraft:block_face')
        const sourceCardinalDirection = dimension.getBlock(position).permutation.getState('minecraft:cardinal_direction')

        const possiblePlacements: PossiblePlacements[] = []

        for (const branch of possibleBranches) {
            let targetRotation: '0_degrees' | '90_degrees' | '180_degrees' | '270_degrees' = '0_degrees'

            if (branch.data.blockFace === 'north') {
                if (sourceBlockFace === 'north') targetRotation = '180_degrees'
                if (sourceBlockFace === 'east') targetRotation = '270_degrees'
                if (sourceBlockFace === 'west') targetRotation = '90_degrees'
                if (sourceBlockFace === 'south') targetRotation = '0_degrees'
            }

            if (branch.data.blockFace === 'east') {
                if (sourceBlockFace === 'north') targetRotation = '90_degrees'
                if (sourceBlockFace === 'east') targetRotation = '180_degrees'
                if (sourceBlockFace === 'west') targetRotation = '0_degrees'
                if (sourceBlockFace === 'south') targetRotation = '270_degrees'
            }

            if (branch.data.blockFace === 'west') {
                if (sourceBlockFace === 'north') targetRotation = '270_degrees'
                if (sourceBlockFace === 'east') targetRotation = '0_degrees'
                if (sourceBlockFace === 'west') targetRotation = '180_degrees'
                if (sourceBlockFace === 'south') targetRotation = '90_degrees'
            }

            if (branch.data.blockFace === 'south') {
                if (sourceBlockFace === 'north') targetRotation = '0_degrees'
                if (sourceBlockFace === 'east') targetRotation = '90_degrees'
                if (sourceBlockFace === 'west') targetRotation = '270_degrees'
                if (sourceBlockFace === 'south') targetRotation = '180_degrees'
            }

            if (branch.data.jointType === "aligned" && data.jointType === "aligned") {
                if (branch.data.cardinalDirection === "north") {
                    if (sourceCardinalDirection === "north") targetRotation = '0_degrees'
                    if (sourceCardinalDirection === "east") targetRotation = '90_degrees'
                    if (sourceCardinalDirection === "west") targetRotation = '270_degrees'
                    if (sourceCardinalDirection === "south") targetRotation = '180_degrees'
                }

                if (branch.data.cardinalDirection === "east") {
                    if (sourceCardinalDirection === "north") targetRotation = '270_degrees'
                    if (sourceCardinalDirection === "east") targetRotation = '0_degrees'
                    if (sourceCardinalDirection === "west") targetRotation = '180_degrees'
                    if (sourceCardinalDirection === "south") targetRotation = '90_degrees'
                }

                if (branch.data.cardinalDirection === "west") {
                    if (sourceCardinalDirection === "north") targetRotation = '90_degrees'
                    if (sourceCardinalDirection === "east") targetRotation = '180_degrees'
                    if (sourceCardinalDirection === "west") targetRotation = '0_degrees'
                    if (sourceCardinalDirection === "south") targetRotation = '270_degrees'
                }

                if (branch.data.cardinalDirection === "south") {
                    if (sourceCardinalDirection === "north") targetRotation = '180_degrees'
                    if (sourceCardinalDirection === "east") targetRotation = '270_degrees'
                    if (sourceCardinalDirection === "west") targetRotation = '90_degrees'
                    if (sourceCardinalDirection === "south") targetRotation = '0_degrees'
                }
            }

            const upOrDown = (branch.data.blockFace === "up" || branch.data.blockFace === "down")


            if (branch.data.jointType === "rollable" && upOrDown) {
                const rotations = ['0_degrees', '90_degrees', '180_degrees', '270_degrees']

                const randomIndex = randomMinMax(0, rotations.length - 1)

                targetRotation = rotations[randomIndex] as any
            }

            let branchOffset = branch.offset

            if (targetRotation === '90_degrees') {
                branchOffset = {
                    x: bounds.size.z - branchOffset.z - 1,
                    y: branchOffset.y,
                    z: branchOffset.x,
                }

                bounds.size = {
                    x: bounds.size.z,
                    y: bounds.size.y,
                    z: bounds.size.x,
                }
            }

            if (targetRotation === '180_degrees') {
                branchOffset = {
                    x: bounds.size.x - branchOffset.x - 1,
                    y: branchOffset.y,
                    z: bounds.size.z - branchOffset.z - 1,
                }
            }

            if (targetRotation === '270_degrees') {
                branchOffset = {
                    x: branchOffset.z,
                    y: branchOffset.y,
                    z: bounds.size.x - branchOffset.x - 1,
                }

                bounds.size = {
                    x: bounds.size.z,
                    y: bounds.size.y,
                    z: bounds.size.x,
                }
            }

            let sourceOffset = {
                x: 0,
                y: 0,
                z: -1,
            }

            if (sourceBlockFace === 'east') sourceOffset = {
                x: 1,
                y: 0,
                z: 0,
            }

            if (sourceBlockFace === 'south') sourceOffset = {
                x: 0,
                y: 0,
                z: 1,
            }

            if (sourceBlockFace === 'west') sourceOffset = {
                x: -1,
                y: 0,
                z: 0,
            }

            if (sourceBlockFace === "up") sourceOffset = {
                x: 0,
                y: 1,
                z: 0
            }


            if (sourceBlockFace === "down") sourceOffset = {
                x: 0,
                y: -1,
                z: 0
            }

            const placementPosition = {
                x: position.x + sourceOffset.x - branchOffset.x,
                y: position.y + sourceOffset.y - branchOffset.y,
                z: position.z + sourceOffset.z - branchOffset.z,
            }

            const placementBounds = {
                start: placementPosition,
                size: bounds.size
            }

            possiblePlacements.push({
                position: placementPosition,
                bounds: placementBounds,
                sourceOffset,
                targetRotation
            })
        }

        const validPlacements: PlacementResult[] = []

        const mutex = await lockBoundsMutex(possiblePlacements.map(placement => placement.bounds))

        for (const possiblePlacement of possiblePlacements) {


            const placedBounds = getPlacedBounds()


            const jigsawBounds: Bounds = {
                size: {
                    x: 1,
                    y: 1,
                    z: 1
                },
                start: position
            }



            let canPlace = true
            for (const otherBounds of placedBounds) {
                if (!boundsIntersect(possiblePlacement.bounds, otherBounds) || (boundsFitsSmaller(possiblePlacement.bounds, otherBounds) && boundsFit(jigsawBounds, otherBounds))) continue

                canPlace = false

                break
            }



            if (!canPlace) continue

            if (chosenStructure.element.element_type == "minecraft:list_pool_element" && structuresToPlace.length > 1) {
                for (const structure of structuresToPlace) {
                    const nextStructureBounds: Bounds = {
                        start: possiblePlacement.bounds.start,
                        size: parseSize(structure)
                    }

                    if (!boundsIntersect(possiblePlacement.bounds, nextStructureBounds) || boundsFit(nextStructureBounds, possiblePlacement.bounds)) continue

                    canPlace = false

                    break
                }
            }

            if (!canPlace) break

            validPlacements.push({
                structures: structuresToPlace,
                position: possiblePlacement.position,
                rotation: possiblePlacement.targetRotation,
                bounds: possiblePlacement.bounds,
                connectedPosition: {
                    x: position.x + possiblePlacement.sourceOffset.x,
                    y: position.y + possiblePlacement.sourceOffset.y,
                    z: position.z + possiblePlacement.sourceOffset.z,
                },
                mutex
            })

            break
        }

        if (validPlacements.length === 0) {
            unlockBoundsMutex(mutex)

            continue
        }


        return validPlacements[Math.floor(Math.random() * validPlacements.length)]
    }
    //} catch (err) {
    // console.warn(err)
    //return null
    //  }

    return null
}

async function getBranches(name: string, position: Vector3, bounds: Bounds, dimension): Promise<StructureBranches> {
    if (structureBranchesCache[name]) return structureBranchesCache[name]

    const mutex = await lockBoundsMutex([bounds])

    const entities = (await placeStructureAndGetEntities(name, position, '0_degrees', true, bounds, dimension))

    const result = entities
        .filter(entity => entity.typeId === 'jigsaw:jigsaw_data')
        .map(entity => {
            return {
                offset: {
                    x: Math.floor(entity.location.x - position.x),
                    y: Math.floor(entity.location.y - position.y),
                    z: Math.floor(entity.location.z - position.z),
                },
                data: JSON.parse(entity.getDynamicProperty('jigsawData') as string) as JigsawBlockData
            }
        })

    for (const entity of entities) {
        if (entity.typeId === 'jigsaw:jigsaw_data') {
            const data = JSON.parse(entity.getDynamicProperty('jigsawData') as string) as JigsawBlockData

            data.branch = true
            entity.setDynamicProperty('jigsawData', JSON.stringify(data, null, 4))
        }

        entity.remove()
    }

    structureBranchesCache[name] = result

    unlockBoundsMutex(mutex)

    return result
}