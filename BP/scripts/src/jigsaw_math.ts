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
        a.start.x < b.start.x + b.size.x &&
        a.start.y < b.start.y + b.size.y &&
        a.start.z < b.start.z + b.size.z
    ) return true

    if (
        b.start.x >= a.start.x &&
        b.start.y >= a.start.y &&
        b.start.z >= a.start.z &&
        b.start.x <= a.start.x + a.size.x &&
        b.start.y <= a.start.y + a.size.y &&
        b.start.z <= a.start.z + a.size.z
    ) return true

    return false
}