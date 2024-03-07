import { system, world, Player, Vector3 } from "@minecraft/server"
import { templatePools } from '../../datapack/template_pools'
import { getTemplatePool, elementWeightedRandom } from '../util/template_pool_utils'
import { parseSize, addPlacedBounds } from '../util/jigsaw_generator_utils'
import { TemplatePool, TemplatePoolElement, EmptyPoolElement, SinglePoolElement, ListPoolElement } from '../types'

system.afterEvents.scriptEventReceive.subscribe(scriptEvent => {
    if (scriptEvent.id != "jigsaw:place") return

    const args: string[] = scriptEvent.message.split(" ")

    let foundTemplatePool: TemplatePool | null = getTemplatePool(args[0])

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

    const bounds = {
        start: {
            x: Math.floor(scriptEvent.sourceEntity.location.x),
            y: Math.floor(scriptEvent.sourceEntity.location.y),
            z: Math.floor(scriptEvent.sourceEntity.location.z),
        },
        size: parseSize(chosenStructure),
    }

    addPlacedBounds(bounds)

    scriptEvent.sourceEntity.dimension.runCommand(`structure load "${chosenStructure}" ${scriptEvent.sourceEntity.location.x} ${scriptEvent.sourceEntity.location.y} ${scriptEvent.sourceEntity.location.z} 0_degrees`)
})