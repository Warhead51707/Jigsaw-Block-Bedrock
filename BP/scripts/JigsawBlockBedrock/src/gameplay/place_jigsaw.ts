import { system, world, Player, Vector3, Structure, StructureRotation } from "@minecraft/server"
import { getTemplatePool, elementWeightedRandom } from '../util/template_pool_utils'
import { parseSize, addPlacedBounds } from '../util/jigsaw_generator_utils'
import { placeStructureAndGetEntities } from '../generator/jigsaw_smart_queue'
import { generate } from '../generator/jigsaw_generator'
import { TemplatePool, TemplatePoolElement, EmptyPoolElement, SinglePoolElement, ListPoolElement } from '../types'

system.afterEvents.scriptEventReceive.subscribe(async scriptEvent => {
    if (scriptEvent.id != "jigsaw:place") return

    const args: string[] = scriptEvent.message.split(" ")

    let foundTemplatePool: TemplatePool | null = await getTemplatePool(args[0])

    if (foundTemplatePool == null) {
        (scriptEvent.sourceEntity as Player).sendMessage(`Invalid template pool: ${args[0]}`)
        return
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

    addPlacedBounds(bounds)

    scriptEvent.sourceEntity.dimension.runCommand(`structure load "${structure.id}" ${scriptEvent.sourceEntity.location.x} ${scriptEvent.sourceEntity.location.y} ${scriptEvent.sourceEntity.location.z} 0_degrees`)
})