import { Vector3 } from "@minecraft/server"

export type JigsawBlockData = {
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    jointType: "rollable" | "aligned",
    keep: boolean,

    facingDirection: string,

    branch: boolean,
}

export type TemplatePool = {
    id: string,
    elements: TemplatePoolElement[]
}

export type TemplatePoolElement = {
    weight: number,
    element: TemplatePoolElementData
}

type TemplatePoolElementData = {
    location: string
}

export interface Bounds {
    start: Vector3,
    size: Vector3,
}

export interface PlacementResult {
    name: string,
    position: Vector3,
    rotation: "0_degrees" | "90_degrees" | "180_degrees" | "270_degrees",
    bounds: Bounds
    connectedPosition: Vector3,
}