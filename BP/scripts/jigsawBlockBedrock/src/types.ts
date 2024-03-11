import { Vector3, StructureRotation, Structure } from "@minecraft/server"
import { MutexRequest } from './generator/jigsaw_smart_queue.js'

export type JigsawMacroData = {
    macroEnabled: boolean,
    macroOwner: string,
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    jointType: "rollable" | "aligned",
    selectionPriority: number,
    placementPriority: number
}

export type JigsawBlockData = {
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    selectionPriority: number,
    placementPriority: number,
    jointType: "rollable" | "aligned",
    levels: number,
    level: number,

    cardinalDirection: string,
    blockFace: string,

    branch: boolean,
}

export type TemplatePool = {
    id: string,
    fallback: string,
    levels?: number,
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
    structures: Structure[],
    selectionPriority: number,
    position: Vector3,
    rotation: StructureRotation,
    bounds: Bounds
    connectedPosition: Vector3,
    mutex: MutexRequest
}

export type StructureBranches = { data: JigsawBlockData, offset: Vector3 }[]