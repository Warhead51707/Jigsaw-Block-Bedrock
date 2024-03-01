import { world } from '@minecraft/server'
import { templatePools } from '../../datapack/template_pools'
import { TemplatePool, SinglePoolElement, EmptyPoolElement, ListPoolElement, TemplatePoolElement } from '../types'
import { weightedRandom } from '../util/jigsaw_math'


export function getTemplatePool(id: string): TemplatePool | null {
    const foundTemplatePool: TemplatePool | undefined = templatePools.find(pool => pool.id == id)

    if (foundTemplatePool == undefined) {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Jigsaw contains bad target pool '${id}`)
        return null
    }

    const fallbackTemplatePool: TemplatePool | undefined = templatePools.find(pool => pool.id == foundTemplatePool.fallback)

    if (fallbackTemplatePool == undefined || foundTemplatePool.fallback == undefined || typeof foundTemplatePool.fallback != 'string') {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a non-existant fallback pool '${foundTemplatePool.fallback}`)
        return null
    }

    if (foundTemplatePool.elements.length == 0 || foundTemplatePool.elements == undefined || typeof foundTemplatePool.elements != 'object') {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains no elements`)
        return null
    }

    for (let poolElement of foundTemplatePool.elements) {
        if (poolElement.weight == undefined || typeof poolElement.weight != "number") {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains element with no weight`)
            return null
        }

        if (poolElement.element == undefined || typeof poolElement.element != "object") {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains element with no sub-element`)
            return null
        }

        if (poolElement.element.element_type == undefined || typeof poolElement.element.element_type != "string") {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains element with bad element type`)
            return null
        }

        if (poolElement.element.element_type != "minecraft:single_pool_element" && poolElement.element.element_type != "minecraft:list_pool_element" && poolElement.element.element_type != "minecraft:empty_pool_element") {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains element with invalid element type '${poolElement.element.element_type}'`)
            return null
        }

        //Empty
        if (poolElement.element.element_type == "minecraft:empty_pool_element") return null

        //Single Pool
        if (poolElement.element.element_type == "minecraft:single_pool_element") {
            const projection: string | undefined = (poolElement.element as SinglePoolElement).projection
            const processors: string | undefined = (poolElement.element as SinglePoolElement).processors
            const location: string | undefined = (poolElement.element as SinglePoolElement).location

            if (projection == undefined || typeof projection != "string" || projection != "rigid") {
                console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a single pool element with invalid projection value`)
                return null
            }

            if (processors == undefined || typeof processors != "string" || processors != "minecraft:empty") {
                console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a single pool element with invalid processors value`)
                return null
            }

            if (location == undefined || typeof location != "string") {
                console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a single pool element with no location value`)
                return null
            }

            return foundTemplatePool
        }

        //List Pool COMING SOON
        if (poolElement.element.element_type == "minecraft:list_pool_element") return null
    }



    return null
}

export function elementWeightedRandom(elements: TemplatePoolElement[]): TemplatePoolElement | null {
    const chosenElement: TemplatePoolElement = weightedRandom(elements)

    if (chosenElement.element.element_type == "minecraft:empty_pool_element") return null
    if (chosenElement.element.element_type == "minecraft:list_pool_element") return null

    return chosenElement
}