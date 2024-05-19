import { world } from '@minecraft/server'
import { TemplatePool, SinglePoolElement, EmptyPoolElement, ListPoolElement, TemplatePoolElement, TemplatePoolSubElement } from '../types'
import { weightedRandom } from '../util/jigsaw_math'

const templatePoolCache: TemplatePool[] = []

export async function getTemplatePool(id: string): Promise<TemplatePool | null> {
    if (id == "minecraft:empty") return null

    let foundTemplatePool: TemplatePool | undefined

    let cachedPool: TemplatePool | undefined = templatePoolCache.find(pool => pool.id == id)

    if (cachedPool == undefined) {
        try {
            const foundTemplatePoolModule = await import(`../../datapack/template_pool/${id.split(":")[0]}/${id.split(":")[1]}`)

            foundTemplatePool = foundTemplatePoolModule.default
            templatePoolCache.push(foundTemplatePool)
        } catch (err) {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Could not file target pool file '${id}'`)
            console.warn(err)
            return null
        }
    } else {
        foundTemplatePool = cachedPool
    }

    if (foundTemplatePool == undefined) {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Jigsaw contains bad target pool '${id}`)
        return null
    }

    const fallbackTemplatePool: TemplatePool | undefined = await getTemplatePool(foundTemplatePool.fallback)

    if ((fallbackTemplatePool == undefined || foundTemplatePool.fallback == undefined || typeof foundTemplatePool.fallback != 'string') && foundTemplatePool.fallback != "minecraft:empty") {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a non-existant fallback pool '${foundTemplatePool.fallback}`)
        return null
    }

    if (foundTemplatePool.elements == undefined || typeof foundTemplatePool.elements != 'object') {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains no elements`)
        return null
    }

    if (foundTemplatePool.levels != undefined) {
        if (foundTemplatePool.levels < 0 || foundTemplatePool.levels > 50 || typeof foundTemplatePool.levels != "number") {
            console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains invalid levels value`)
            return null
        }
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
            if (singlePoolChecks(poolElement.element as EmptyPoolElement & SinglePoolElement, foundTemplatePool) == null) return null

            return foundTemplatePool
        }

        //List Pool
        if (poolElement.element.element_type == "minecraft:list_pool_element") {
            const projection: string | undefined = (poolElement.element as ListPoolElement).projection
            const elements: TemplatePoolSubElement[] | undefined = (poolElement.element as ListPoolElement).elements

            if (projection == undefined || typeof projection != "string" || (projection != "rigid" && projection != "terrain_matching")) {
                console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a list pool element with invalid projection value`)
                return null
            }

            if (elements == undefined || typeof elements != "object" || elements.length == 0) {
                console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a list pool element with invalid elements value`)
                return null
            }

            for (const element of elements) {
                const elementType: string | undefined = (element as EmptyPoolElement & SinglePoolElement).element_type

                if (elementType == undefined || elementType != "minecraft:single_pool_element") {
                    console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${foundTemplatePool.id}' contains a list pool element with invalid element type value`)
                    return null
                }

                if (singlePoolChecks(element as EmptyPoolElement & SinglePoolElement, foundTemplatePool) == null) return null
            }

            return foundTemplatePool
        }
    }


    return null
}

function singlePoolChecks(element: EmptyPoolElement & SinglePoolElement, templatePool: TemplatePool): true | null {
    const projection: string | undefined = element.projection
    const processors: string | undefined = element.processors
    const location: string | undefined = element.location

    if (projection == undefined || typeof projection != "string" || (projection != "rigid" && projection != "terrain_matching")) {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${templatePool.id}' contains a single pool element with invalid projection value`)
        return null
    }

    if (processors == undefined || typeof processors != "string" || processors != "minecraft:empty") {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${templatePool.id}' contains a single pool element with invalid processors value`)
        return null
    }

    if (location == undefined || typeof location != "string") {
        console.warn(`§dJigsaw Block Bedrock§r (§4Error§r): Template pool '${templatePool.id}' contains a single pool element with no location value`)
        return null
    }

    return true
}

export function elementWeightedRandom(elements: TemplatePoolElement[]): TemplatePoolElement | null {
    const chosenElement: TemplatePoolElement = weightedRandom(elements)

    if (chosenElement.element.element_type == "minecraft:empty_pool_element") return null

    return chosenElement
}