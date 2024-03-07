import { world } from "@minecraft/server"
import { Bounds } from "../types"

export function weightedRandom(weightedArray: any[]): any {
    const weights = []

    for (const entry of weightedArray) {
        for (let i = 0; i < entry.weight; i++) {
            weights.push(entry)
        }
    }

    return weights[Math.floor(Math.random() * weights.length)]
}

export function randomMinMax(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
}

export function boundsIntersect(a: Bounds, b: Bounds) {
    const xAxisIntersect = (a.start.x < b.start.x + b.size.x) && (a.start.x + a.size.x > b.start.x) || a.start.x === b.start.x
    const yAxisIntersect = (a.start.y < b.start.y + b.size.y) && (a.start.y + a.size.y > b.start.y) || a.start.y === b.start.y
    const zAxisIntersect = (a.start.z < b.start.z + b.size.z) && (a.start.z + a.size.z > b.start.z) || a.start.z === b.start.z

    return xAxisIntersect && yAxisIntersect && zAxisIntersect
}

export function boundsFit(smallerBounds: Bounds, largerBounds: Bounds) {
    let xAxisFits = (smallerBounds.start.x >= largerBounds.start.x) && (smallerBounds.start.x + smallerBounds.size.x <= largerBounds.start.x + largerBounds.size.x)
    let yAxisFits = (smallerBounds.start.y >= largerBounds.start.y) && (smallerBounds.start.y + smallerBounds.size.y <= largerBounds.start.y + largerBounds.size.y)
    let zAxisFits = (smallerBounds.start.z >= largerBounds.start.z) && (smallerBounds.start.z + smallerBounds.size.z <= largerBounds.start.z + largerBounds.size.z)

    return xAxisFits && yAxisFits && zAxisFits
}

export function boundsFitsSmaller(smallerBounds: Bounds, largerBounds: Bounds) {
    if (smallerBounds.start.x == largerBounds.start.x && smallerBounds.start.y == largerBounds.start.y && smallerBounds.start.z == largerBounds.start.z && smallerBounds.size.x == largerBounds.size.x && smallerBounds.size.y == largerBounds.size.y && smallerBounds.size.z == largerBounds.size.z) return false

    return boundsFit(smallerBounds, largerBounds)
}