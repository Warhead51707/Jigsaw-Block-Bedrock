import { world, system, Dimension, Vector3, Entity } from "@minecraft/server"
import { Bounds } from "./types"
import { boundsIntersect } from "./jigsaw_math"

async function waitTick() {
    await new Promise<void>(res => {
        system.runTimeout(res, 1)
    })
}

const queue: { [key: string]: { name: string, position: Vector3, rotation: string, onlyEntities: boolean, bounds: Bounds, dimension: Dimension, resolve: (entities: Entity[]) => void, loading: boolean } } = {}
let nextQueueId = 0

export async function placeStructureAndGetEntities(name: string, position: Vector3, rotation: string, onlyEntities: boolean, bounds: Bounds, dimension: Dimension): Promise<Entity[]> {
    const task: any = { name, bounds, position, rotation, onlyEntities, loading: false, dimension }

    const result = new Promise<Entity[]>(resolve => {
        task.resolve = resolve
    })

    const id = nextQueueId
    nextQueueId++

    queue[id] = task

    return await result
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

            async function load() {
                const existingEntityIds = queueItem.dimension.getEntities().map(entity => entity.id)

                await queueItem.dimension.runCommand(`structure load "${queueItem.name}" ${queueItem.position.x} ${queueItem.position.y} ${queueItem.position.z} ${queueItem.rotation} none true ${!queueItem.onlyEntities}`)
                await waitTick()

                delete queue[id]

                const containedEntities = queueItem.dimension.getEntities().filter(entity => boundsIntersect({ start: entity.location, size: { x: 0, y: 0, z: 0 } }, queueItem.bounds))

                queueItem.resolve(containedEntities.filter(entity => !existingEntityIds.includes(entity.id)))
            }

            load()
        }
    }, 1)
})