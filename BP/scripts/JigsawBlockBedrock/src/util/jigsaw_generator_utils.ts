import { world, Vector3, StructureRotation } from '@minecraft/server'
import { Bounds } from '../types'


export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export interface PossiblePlacements {
    position: Vector3,
    bounds: Bounds,
    sourceOffset: Vector3,
    targetRotation: StructureRotation
}

export function parseSize(name: string): Vector3 {
    const elements = name.split('_')

    return {
        x: parseInt(elements[elements.length - 3]),
        y: parseInt(elements[elements.length - 2]),
        z: parseInt(elements[elements.length - 1]),
    }
}

export function getPlacedBounds(): Bounds[] {
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

export function addPlacedBounds(bounds: Bounds) {
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