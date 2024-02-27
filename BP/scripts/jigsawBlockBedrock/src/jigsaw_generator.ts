import { world, Dimension, Entity, Block, Vector3, system } from '@minecraft/server'
import { JigsawBlockData, TemplatePool, TemplatePoolElement, PlacementResult, Bounds, StructureBranches } from './types'
import { templatePools } from '../datapack/template_pools'
import { weightedRandom, boundsIntersect, boundsFit, randomMinMax } from './jigsaw_math'
import { placeStructureAndGetEntities } from './smart_queue'

// util functions

function parseSize(name: string): Vector3 {
    const elements = name.split('_')

    return {
        x: parseInt(elements[elements.length - 3]),
        y: parseInt(elements[elements.length - 2]),
        z: parseInt(elements[elements.length - 1]),
    }
}

function getPlacedBounds(): Bounds[] {
    let placedBoundsLength = 0

    while (true) {
        if (world.getDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength}`) == undefined) break

        placedBoundsLength++
    }

    let allBounds: Bounds[] = []

    for (let i = 0; i < placedBoundsLength; i++) {
        allBounds = allBounds.concat(JSON.parse(world.getDynamicProperty(`jigsaw:placed_bounds_${i}`) as string))
    }

    return allBounds
}

function addPlacedBounds(bounds: Bounds) {
    const placedBounds = getPlacedBounds()
    placedBounds.push(bounds)

    let placedBoundsLength = 0

    while (true) {
        if (world.getDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength + 1}`) == undefined) break

        placedBoundsLength++
    }

    try {
        world.setDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength}`, JSON.stringify(placedBounds))
    } catch {
        const newPlacedBounds: Bounds[] = []

        newPlacedBounds.push(bounds)

        world.setDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength + 1}`, JSON.stringify(newPlacedBounds, null, 4))
    }

}

///

world.beforeEvents.chatSend.subscribe(event => {
    if (!event.sender.isOp) return

    // Add debug commands here
})

world.afterEvents.worldInitialize.subscribe(event => {
    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            if (!player.getTags().includes('debug')) continue

            const boundingBoxes = getPlacedBounds()

            for (const bounds of boundingBoxes) {
                try {
                    for (let x = 0; x <= bounds.size.x; x++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y,
                            z: bounds.start.z + bounds.size.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + bounds.size.z,
                        })
                    }

                    for (let z = 0; z <= bounds.size.z; z++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + z,
                        })
                    }

                    for (let y = 0; y <= bounds.size.y; y++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z + bounds.size.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z + bounds.size.z,
                        })
                    }
                } catch { }
            }
        }
    }, 20)
})

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

const structureBranchesCache: { [key: string]: StructureBranches } = {}

async function getBranches(name: string, position: Vector3, bounds: Bounds, dimension): Promise<StructureBranches> {
    if (structureBranchesCache[name]) return structureBranchesCache[name]

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

    return result
}

export async function getPlacement(position: Vector3, dimension: Dimension, data: JigsawBlockData, targetPool: TemplatePool): Promise<PlacementResult | null> {
    const targetPoolElements: TemplatePoolElement[] = JSON.parse(JSON.stringify(targetPool.elements))

    while (targetPoolElements.length > 0) {
        const chosenStructure: TemplatePoolElement = weightedRandom(targetPoolElements)
        targetPoolElements.splice(targetPoolElements.indexOf(chosenStructure), 1)

        const bounds = {
            start: position,
            size: parseSize(chosenStructure.element.location)
        }

        const branches = await getBranches(chosenStructure.element.location, position, bounds, dimension)
        const possibleBranches = shuffle(branches.filter(branch => branch.data.name === data.targetName)) as StructureBranches

        const sourceBlockFace = dimension.getBlock(position).permutation.getState('minecraft:block_face')
        const sourceCardinalDirection = dimension.getBlock(position).permutation.getState('minecraft:cardinal_direction')

        const validPlacements: PlacementResult[] = []

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

            const placedBounds = getPlacedBounds()

            let canPlace = true
            for (const otherBounds of placedBounds) {
                if (!boundsIntersect(placementBounds, otherBounds) || boundsFit(placementBounds, otherBounds)) continue

                canPlace = false

                break
            }

            if (!canPlace) continue

            validPlacements.push({
                name: chosenStructure.element.location,
                position: placementPosition,
                rotation: targetRotation,
                bounds: placementBounds,
                connectedPosition: {
                    x: position.x + sourceOffset.x,
                    y: position.y + sourceOffset.y,
                    z: position.z + sourceOffset.z,
                }
            })

            break
        }

        if (validPlacements.length === 0) continue

        return validPlacements[Math.floor(Math.random() * validPlacements.length)]
    }

    return null
}

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
    if (data.targetPool === 'minecraft:empty') {
        block.setType(data.turnsInto)

        return
    }

    let targetPool: TemplatePool = templatePools.find(pool => pool.id == data.targetPool)

    // target pool could not be found, probably user configuration error
    if (targetPool === undefined) {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Jigsaw at (${block.location.x}, ${block.location.y}, ${block.location.z}) contains bad target pool '${data.targetPool}`)

        return
    }

    if (targetPool.elements.length == 0) return

    let placement = await getPlacement(position, dimension, data, targetPool)

    // fallbacks
    while (placement == null) {
        targetPool = templatePools.find(pool => pool.id == targetPool.fallback)

        if (targetPool == undefined || targetPool.elements.length == 0 || targetPool.id == "minecraft:empty") {
            block.setType(data.turnsInto)

            return
        }

        placement = await getPlacement(position, dimension, data, targetPool)
    }

    block.setType(data.turnsInto)

    addPlacedBounds(placement.bounds)

    const branchEntities = await placeStructureAndGetEntities(placement.name, placement.position, placement.rotation, false, placement.bounds, dimension)

    for (const branchEntity of branchEntities) {
        if (branchEntity.typeId !== 'jigsaw:jigsaw_data') continue

        const branchData: JigsawBlockData = JSON.parse(branchEntity.getDynamicProperty('jigsawData') as string)

        if (
            Math.floor(branchEntity.location.x) === placement.connectedPosition.x &&
            Math.floor(branchEntity.location.y) === placement.connectedPosition.y &&
            Math.floor(branchEntity.location.z) === placement.connectedPosition.z
        ) {
            dimension.getBlock(placement.connectedPosition).setType(branchData.turnsInto)

            branchEntity.remove()

            continue
        }


        branchData.branch = true
        branchEntity.setDynamicProperty('jigsawData', JSON.stringify(branchData, null, 4))

        generate(branchEntity)
    }
}

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
    }, 10)
})