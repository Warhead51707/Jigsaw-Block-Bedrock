import { Bounds } from "./types"

export function weightedRandom(weightedArray: any[]): any {
    const weights = []

    for (const entry of weightedArray) {
        for (let i = 0; i < entry.weight; i++) {
            weights.push(entry)
        }
    }

    return weights[Math.floor(Math.random() * weights.length)]
}

export function boundsIntersect(a: Bounds, b: Bounds) {
    if (
        a.start.x >= b.start.x &&
        a.start.y >= b.start.y &&
        a.start.z >= b.start.z &&
        a.start.x <= b.end.x &&
        a.start.y <= b.end.y &&
        a.start.z <= b.end.z
    ) return true

    if (
        b.start.x >= a.start.x &&
        b.start.y >= a.start.y &&
        b.start.z >= a.start.z &&
        b.start.x <= a.end.x &&
        b.start.y <= a.end.y &&
        b.start.z <= a.end.z
    ) return true

    return false
}