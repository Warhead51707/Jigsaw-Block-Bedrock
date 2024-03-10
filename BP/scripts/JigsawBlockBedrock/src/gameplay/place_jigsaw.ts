import { system, world, Player, Vector3, Structure, StructureRotation, Entity } from "@minecraft/server"
import { getTemplatePool, elementWeightedRandom } from '../util/template_pool_utils'
import { parseSize, addPlacedBounds } from '../util/jigsaw_generator_utils'
import { placeStructureAndGetEntities } from '../generator/jigsaw_smart_queue'
import { generate } from '../generator/jigsaw_generator'
import { TemplatePool, TemplatePoolElement, EmptyPoolElement, SinglePoolElement, ListPoolElement, JigsawBlockData } from '../types'

system.afterEvents.scriptEventReceive.subscribe(async scriptEvent => {
    if (scriptEvent.id != "jigsaw:place") return

    const args: string[] = scriptEvent.message.split(" ")

    let foundTemplatePool: TemplatePool | null = await getTemplatePool(args[0])

    if (foundTemplatePool == null) {
        (scriptEvent.sourceEntity as Player).sendMessage(`Invalid template pool: ${args[0]}`)
        return
    }

    let maxLevels = 0

    if (args[1] == undefined) {
        (scriptEvent.sourceEntity as Player).sendMessage(`Max depth not defined.`)
        return
    }

    if (typeof parseInt(args[1]) != "number") {
        (scriptEvent.sourceEntity as Player).sendMessage(`Max depth must be an integer.`)
        return
    }

    maxLevels = parseInt(args[1])

    const placementPosition: Vector3 = {
        x: 0,
        y: 0,
        z: 0
    }

    for (let i = 2; i < 5; i++) {
        if (args[i] == undefined) {
            (scriptEvent.sourceEntity as Player).sendMessage(`Undefined position value.`)
            return
        }

        if (args[i].startsWith("~")) {
            let value = 0

            if (i == 2) value = scriptEvent.sourceEntity.location.x
            if (i == 3) value = scriptEvent.sourceEntity.location.y
            if (i == 4) value = scriptEvent.sourceEntity.location.z

            if (i == 2) placementPosition.x = value
            if (i == 3) placementPosition.y = value
            if (i == 4) placementPosition.z = value

            continue

        }

        const inputValue = parseInt(args[i])

        if (typeof inputValue != "number") {
            (scriptEvent.sourceEntity as Player).sendMessage(`Position value not a number.`)
            return
        }

        if (i == 2) placementPosition.x = inputValue
        if (i == 3) placementPosition.y = inputValue
        if (i == 4) placementPosition.z = inputValue
    }

    const chosenElement: TemplatePoolElement = elementWeightedRandom(foundTemplatePool.elements)

    let chosenStructure: string

    if (chosenElement.element.element_type == "minecraft:list_pool_element") {
        chosenStructure = ((chosenElement.element as EmptyPoolElement & ListPoolElement).elements[0] as EmptyPoolElement & SinglePoolElement).location
    }

    if (chosenElement.element.element_type == "minecraft:single_pool_element") {
        chosenStructure = (chosenElement.element as EmptyPoolElement & SinglePoolElement).location
    }

    if (chosenElement.element.element_type == "minecraft:empty_pool_element") return

    const structure: Structure = world.structureManager.get(chosenStructure)

    const bounds = {
        start: {
            x: Math.floor(scriptEvent.sourceEntity.location.x),
            y: Math.floor(scriptEvent.sourceEntity.location.y),
            z: Math.floor(scriptEvent.sourceEntity.location.z),
        },
        size: structure.size,
    }

    const entities = await placeStructureAndGetEntities(structure, placementPosition, StructureRotation.None, false, bounds, scriptEvent.sourceEntity.dimension)

    addPlacedBounds(bounds)

    for (const branchEntity of entities as Entity[]) {
        if (branchEntity.typeId !== 'jigsaw:jigsaw_data') continue

        const branchData: JigsawBlockData = JSON.parse(branchEntity.getDynamicProperty('jigsawData') as string)

        branchData.levels = maxLevels

        branchEntity.setDynamicProperty('jigsawData', JSON.stringify(branchData))
    }
})