import { Vector3 } from "@minecraft/server"
import { MutexRequest } from './smart_queue.js'

export type JigsawMacroData = {
    macroEnabled: boolean,
    macroOwner: string,
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    jointType: "rollable" | "aligned"
}

export type JigsawBlockData = {
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    jointType: "rollable" | "aligned",
    keep?: boolean,

    cardinalDirection: string,
    blockFace: string,

    branch: boolean,
}

export type TemplatePool = {
    id: string,
    fallback: string,
    elements: TemplatePoolElement[]
}

export type TemplatePoolElement = {
    weight: number,
    element: TemplatePoolSubElement | EmptyPoolElement
}

export type TemplatePoolSubElement = (EmptyPoolElement & SinglePoolElement) | (EmptyPoolElement & ListPoolElement)

export type EmptyPoolElement = {
    element_type: string
}

export type SinglePoolElement = {
    projection: string,
    location: string,
    processors: string
}

export type ListPoolElement = {
    projection: string,
    elements: TemplatePoolSubElement[]
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
    mutex: MutexRequest
}

export type StructureBranches = { data: JigsawBlockData, offset: Vector3 }[]