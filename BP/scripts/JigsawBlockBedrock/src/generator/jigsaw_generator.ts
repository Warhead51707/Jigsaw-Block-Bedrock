import { world, Dimension, Entity, Block, Vector3, system, Structure, StructureRotation } from '@minecraft/server'
import { JigsawBlockData, TemplatePool, TemplatePoolElement, PlacementResult, Bounds, StructureBranches, SinglePoolElement, EmptyPoolElement, ListPoolElement, TemplatePoolSubElement } from '../types'
import { weightedRandom, boundsIntersect, boundsFit, randomMinMax, boundsFitsSmaller } from '../util/jigsaw_math'
import { parseSize, getPlacedBounds, addPlacedBounds, PossiblePlacements, sortByPlacementPriority, sortBySelectionPriority, selectionPriorityExact } from '../util/jigsaw_generator_utils'
import { placeStructureAndGetEntities, lockBoundsMutex, unlockBoundsMutex, MutexRequest } from './jigsaw_smart_queue'
import { getTemplatePool, elementWeightedRandom } from '../util/template_pool_utils'
import { createTerrainMatchedStructure } from './jigsaw_terrain_matching'

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

            if (data.level == 0) {
                block.setType(data.turnsInto)
                return
            }

            generate(event.entity)
        } catch { }
    }, 3)
})

export async function generate(source: Entity) {
    const position: Vector3 = {
        x: Math.floor(source.location.x),
        y: Math.floor(source.location.y),
        z: Math.floor(source.location.z),
    }
    const dimension: Dimension = source.dimension
    const block: Block = dimension.getBlock(position)

    const data: JigsawBlockData = JSON.parse(source.getDynamicProperty('jigsawData') as string)

    dimension.spawnEntity("jigsaw:jigsaw_loader", {
        x: source.location.x,
        y: source.location.y - 1,
        z: source.location.z
    })

    source.remove()

    // This jigsaw has no targetPool to place so we stop here
    if (data.targetPool == 'minecraft:empty') {
        block.setType(data.turnsInto)

        return
    }

    let targetPool: TemplatePool = await getTemplatePool(data.targetPool)

    if (targetPool == null || targetPool == undefined) {
        block.setType(data.turnsInto)

        return
    }

    const maxLevels: number = Math.floor(data.levels)

    if (data.level >= maxLevels) {
        if (targetPool.fallback == undefined) {
            block.setType(data.turnsInto)

            return
        }

        targetPool = await getTemplatePool(targetPool.fallback)

        if (targetPool == undefined) {
            block.setType(data.turnsInto)

            return
        }
    }

    let placement = await getPlacement(position, dimension, data, targetPool)

    block.setType(data.turnsInto)

    if (placement == null) return

    addPlacedBounds(placement.bounds)

    const placementStructure: Structure = placement.structures[0]

    const branchEntities = await placeStructureAndGetEntities(placementStructure, placement.position, placement.rotation, false, placement.bounds, dimension, placement.terrainMatch)

    for (const branchEntity of sortByPlacementPriority(branchEntities) as Entity[]) {
        if (branchEntity.typeId !== 'jigsaw:jigsaw_data') continue

        const branchData: JigsawBlockData = JSON.parse(branchEntity.getDynamicProperty('jigsawData') as string)

        branchData.branch = true
        branchData.levels = maxLevels
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
        const otherPlacementStructure: Structure = placement.structures[i]

        const otherEntities = await placeStructureAndGetEntities(otherPlacementStructure, placement.position, placement.rotation, false, placement.bounds, dimension)

        for (const otherEntity of otherEntities) {
            const otherEntityBranchData: JigsawBlockData = JSON.parse(otherEntity.getDynamicProperty('jigsawData') as string)

            dimension.getBlock(otherEntity.location).setType(otherEntityBranchData.turnsInto)

            otherEntity.remove()
        }
    }

    unlockBoundsMutex(placement.mutex)
}

export async function getPlacement(position: Vector3, dimension: Dimension, data: JigsawBlockData, targetPool: TemplatePool): Promise<PlacementResult | null> {
    const targetPoolElements: TemplatePoolElement[] = JSON.parse(JSON.stringify(targetPool.elements))

    while (targetPoolElements.length > 0) {
        //Template pool logic
        let terrainMatch = false

        let structuresToPlace: Structure[] = []

        let chosenElement: TemplatePoolElement | null = elementWeightedRandom(targetPoolElements)

        if (chosenElement == null || chosenElement == undefined) return null

        targetPoolElements.splice(targetPoolElements.indexOf(chosenElement), 1)

        if (chosenElement.element.element_type == "minecraft:single_pool_element") {
            const structure: Structure = world.structureManager.get((chosenElement.element as EmptyPoolElement & SinglePoolElement).location)
            structuresToPlace.push(structure)

            if ((chosenElement.element as EmptyPoolElement & SinglePoolElement).projection == "terrain_matching") terrainMatch = true
        }

        if (chosenElement.element.element_type == "minecraft:list_pool_element") {
            for (const element of (chosenElement.element as ListPoolElement).elements) {
                const structure: Structure = world.structureManager.get((element as EmptyPoolElement & SinglePoolElement).location)
                structuresToPlace.push(structure)
            }
        }

        ///

        const bounds = {
            start: position,
            size: structuresToPlace[0].size,
        }

        const branches = await getBranches(structuresToPlace[0].id, position, bounds, dimension)

        const possibleBranches = branches.filter(branch => branch.data.name === data.targetName)

        if (dimension.getBlock(position) == undefined) return null

        const sourceBlockFace = dimension.getBlock(position).permutation.getState('minecraft:block_face')
        const sourceCardinalDirection = dimension.getBlock(position).permutation.getState('minecraft:cardinal_direction')

        const possiblePlacements: PossiblePlacements[] = []

        for (const branch of possibleBranches) {
            let targetRotation: StructureRotation = StructureRotation.None

            if (branch.data.blockFace === 'north') {
                if (sourceBlockFace === 'north') targetRotation = StructureRotation.Rotate180
                if (sourceBlockFace === 'east') targetRotation = StructureRotation.Rotate270
                if (sourceBlockFace === 'west') targetRotation = StructureRotation.Rotate90
                if (sourceBlockFace === 'south') targetRotation = StructureRotation.None
            }

            if (branch.data.blockFace === 'east') {
                if (sourceBlockFace === 'north') targetRotation = StructureRotation.Rotate90
                if (sourceBlockFace === 'east') targetRotation = StructureRotation.Rotate180
                if (sourceBlockFace === 'west') targetRotation = StructureRotation.None
                if (sourceBlockFace === 'south') targetRotation = StructureRotation.Rotate270
            }

            if (branch.data.blockFace === 'west') {
                if (sourceBlockFace === 'north') targetRotation = StructureRotation.Rotate270
                if (sourceBlockFace === 'east') targetRotation = StructureRotation.None
                if (sourceBlockFace === 'west') targetRotation = StructureRotation.Rotate180
                if (sourceBlockFace === 'south') targetRotation = StructureRotation.Rotate90
            }

            if (branch.data.blockFace === 'south') {
                if (sourceBlockFace === 'north') targetRotation = StructureRotation.None
                if (sourceBlockFace === 'east') targetRotation = StructureRotation.Rotate90
                if (sourceBlockFace === 'west') targetRotation = StructureRotation.Rotate270
                if (sourceBlockFace === 'south') targetRotation = StructureRotation.Rotate180
            }

            if (branch.data.jointType === "aligned" && data.jointType === "aligned") {
                if (branch.data.cardinalDirection === "north") {
                    if (sourceCardinalDirection === "north") targetRotation = StructureRotation.None
                    if (sourceCardinalDirection === "east") targetRotation = StructureRotation.Rotate90
                    if (sourceCardinalDirection === "west") targetRotation = StructureRotation.Rotate270
                    if (sourceCardinalDirection === "south") targetRotation = StructureRotation.Rotate180
                }

                if (branch.data.cardinalDirection === "east") {
                    if (sourceCardinalDirection === "north") targetRotation = StructureRotation.Rotate270
                    if (sourceCardinalDirection === "east") targetRotation = StructureRotation.None
                    if (sourceCardinalDirection === "west") targetRotation = StructureRotation.Rotate180
                    if (sourceCardinalDirection === "south") targetRotation = StructureRotation.Rotate90
                }

                if (branch.data.cardinalDirection === "west") {
                    if (sourceCardinalDirection === "north") targetRotation = StructureRotation.Rotate90
                    if (sourceCardinalDirection === "east") targetRotation = StructureRotation.Rotate180
                    if (sourceCardinalDirection === "west") targetRotation = StructureRotation.None
                    if (sourceCardinalDirection === "south") targetRotation = StructureRotation.Rotate270
                }

                if (branch.data.cardinalDirection === "south") {
                    if (sourceCardinalDirection === "north") targetRotation = StructureRotation.Rotate180
                    if (sourceCardinalDirection === "east") targetRotation = StructureRotation.Rotate270
                    if (sourceCardinalDirection === "west") targetRotation = StructureRotation.Rotate90
                    if (sourceCardinalDirection === "south") targetRotation = StructureRotation.None
                }
            }

            const upOrDown = (branch.data.blockFace === "up" || branch.data.blockFace === "down")


            if (branch.data.jointType === "rollable" && upOrDown) {
                const rotations = [StructureRotation.None, StructureRotation.Rotate90, StructureRotation.Rotate180, StructureRotation.Rotate270]

                const randomIndex = randomMinMax(0, rotations.length - 1)

                targetRotation = rotations[randomIndex] as any
            }

            let branchOffset = branch.offset

            if (targetRotation === StructureRotation.Rotate90) {
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

            if (targetRotation === StructureRotation.Rotate180) {
                branchOffset = {
                    x: bounds.size.x - branchOffset.x - 1,
                    y: branchOffset.y,
                    z: bounds.size.z - branchOffset.z - 1,
                }
            }

            if (targetRotation === StructureRotation.Rotate270) {
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
                selectionPriority: branch.data.selectionPriority,
                bounds: placementBounds,
                sourceOffset,
                targetRotation
            })
        }
        const validPlacements: PlacementResult[] = []

        const mutex = await lockBoundsMutex(possiblePlacements.map(placement => placement.bounds))

        for (const possiblePlacement of sortBySelectionPriority(possiblePlacements)) {

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

            if (chosenElement.element.element_type == "minecraft:list_pool_element" && structuresToPlace.length > 1) {
                for (const structure of structuresToPlace) {
                    const nextStructureBounds: Bounds = {
                        start: possiblePlacement.bounds.start,
                        size: structure.size
                    }

                    if (!boundsIntersect(possiblePlacement.bounds, nextStructureBounds) || boundsFit(nextStructureBounds, possiblePlacement.bounds)) continue

                    canPlace = false

                    break
                }
            }

            if (!canPlace) break

            validPlacements.push({
                structures: structuresToPlace,
                selectionPriority: possiblePlacement.selectionPriority,
                position: possiblePlacement.position,
                rotation: possiblePlacement.targetRotation,
                bounds: possiblePlacement.bounds,
                connectedPosition: {
                    x: position.x + possiblePlacement.sourceOffset.x,
                    y: position.y + possiblePlacement.sourceOffset.y,
                    z: position.z + possiblePlacement.sourceOffset.z,
                },
                mutex,
                terrainMatch
            })

            break

        }

        if (validPlacements.length === 0) {
            unlockBoundsMutex(mutex)

            continue
        }


        if (selectionPriorityExact(validPlacements)) return validPlacements[Math.floor(Math.random() * validPlacements.length)]

        return validPlacements[0]

    }

    if (targetPool.fallback == undefined) return null

    const fallbackPool = await getTemplatePool(targetPool.fallback)

    if (fallbackPool == undefined) return null

    return await getPlacement(position, dimension, data, fallbackPool)
}

async function getBranches(name: string, position: Vector3, bounds: Bounds, dimension): Promise<StructureBranches> {
    if (structureBranchesCache[name]) return structureBranchesCache[name]

    const mutex = await lockBoundsMutex([bounds])

    const structure: Structure = world.structureManager.get(name)

    const entities = (await placeStructureAndGetEntities(structure, position, StructureRotation.None, true, bounds, dimension))

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