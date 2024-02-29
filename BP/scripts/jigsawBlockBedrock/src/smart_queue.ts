import { world, system, Dimension, Vector3, Entity } from "@minecraft/server"
import { Bounds } from "./types"
import { boundsIntersect } from "./jigsaw_math"

async function waitTick() {
    await new Promise<void>(res => {
        system.runTimeout(res, 1)
    })
}

async function waitTickFast() {
    await new Promise<void>(res => {
        system.run(res)
    })
}

export interface MutexRequest {
    readonly bounds: Bounds[],
    readonly activate: () => {}
}

const activeMutexes: MutexRequest[] = []
const mutexQueue: MutexRequest[] = []

export async function lockBoundsMutex(bounds: Bounds[]): Promise<MutexRequest> {
    let activate = null

    const promise = new Promise<void>(resolve => {
        activate = resolve
    })

    const request = {
        bounds,
        activate
    }

    mutexQueue.push(request)

    await promise

    return request
}

export function unlockBoundsMutex(request: MutexRequest) {
    activeMutexes.splice(activeMutexes.indexOf(request), 1)
}

export async function placeStructureAndGetEntities(name: string, position: Vector3, rotation: string, onlyEntities: boolean, bounds: Bounds, dimension: Dimension): Promise<Entity[]> {
    const existingEntityIds = dimension.getEntities().map(entity => entity.id)

    await dimension.runCommand(`structure load "${name}" ${position.x} ${position.y} ${position.z} ${rotation} none true ${!onlyEntities}`)
    await waitTick()
    await waitTickFast()

    const containedEntities = dimension.getEntities().filter(entity => boundsIntersect({ start: entity.location, size: { x: 0, y: 0, z: 0 } }, bounds))

    return containedEntities.filter(entity => !existingEntityIds.includes(entity.id))
}

function handleMutexes() {
    if (mutexQueue.length === 0) return

    for (const mutex of mutexQueue) {
        let canLoad = true

        for (const myBounds of mutex.bounds) {
            for (const otherMutex of activeMutexes) {
                for (const otherBounds of otherMutex.bounds) {
                    if (!boundsIntersect(myBounds, otherBounds)) continue

                    canLoad = false

                    break
                }

                if (!canLoad) break
            }

            if (!canLoad) break
        }

        if (!canLoad) continue

        activeMutexes.push(mutex)
        mutexQueue.splice(mutexQueue.indexOf(mutex), 1)
        mutex.activate()
    }
}

world.afterEvents.worldInitialize.subscribe(event => {
    system.runInterval(() => {
        handleMutexes()
    }, 0)
})