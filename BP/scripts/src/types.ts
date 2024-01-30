import { Vector3 } from "@minecraft/server"

export type PositiveNegativeCorners = {
    positive: Vector3,
    negative: Vector3
}

export type StructureGenerationData = {
    namespace: string,
    structures: StructureGenerationDataStructure[]
}

export type StructureGenerationDataStructure = {
    location: Vector3,
    size: { length: number, width: number, height: number }
}

export type JigsawBlockData = {
    targetPool: string,
    name: string,
    targetName: string,
    turnsInto: string,
    jointType: "rollable" | "aligned",
    chosenStructure: string,
    facingDirection: string,
    calibrated: boolean,
    childStructureRotation: string,
    childId: string,
    keep: boolean,
    parent: boolean
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