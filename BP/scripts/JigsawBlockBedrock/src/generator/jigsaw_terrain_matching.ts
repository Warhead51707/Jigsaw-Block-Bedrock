import { world, Block, Vector3, Structure, BlockVolume, StructureRotation } from '@minecraft/server'
import { Bounds } from '../types'

export function createTerrainMatchedStructure(structure: Structure, structureBounds: Bounds, rotation: StructureRotation): Structure {

    let xSize = structureBounds.start.x + structureBounds.size.x
    let zSize = structureBounds.start.z + structureBounds.size.z

    if (rotation == StructureRotation.Rotate90 || rotation == StructureRotation.Rotate270) {
        xSize = structureBounds.start.x + structureBounds.size.z
        zSize = structureBounds.start.z + structureBounds.size.x
    }

    const editingBit: Structure = world.structureManager.createFromWorld("jigsaw:terrain_piece", world.getDimension("overworld"), { x: structureBounds.start.x, y: 100, z: structureBounds.start.z }, { x: xSize, y: -64, z: zSize })

    let xCap = structure.size.x
    let zCap = structure.size.z

    if (rotation == StructureRotation.Rotate90 || rotation == StructureRotation.Rotate270) {
        xCap = structure.size.z
        zCap = structure.size.x
    }

    for (let x = 0; x < xCap; x++) {

        for (let y = 0; y < structure.size.y; y++) {

            for (let z = 0; z < zCap; z++) {

                const highestBlock: Block = world.getDimension("overworld").getBlockFromRay({ x: structureBounds.start.x + x, y: 100, z: structureBounds.start.z + z }, { x: 0, y: -1, z: 0 }, {
                    maxDistance: 500
                }).block

                let structureXGuide = x
                let structureZGuide = z


                try {
                    editingBit.setBlockPermutation({ x: x, y: 64 - Math.abs(highestBlock.location.y) + y, z: z }, structure.getBlockPermutation({ x: structureXGuide, y: y, z: structureZGuide }))

                    for (let rebuildLevel = 1; rebuildLevel < 64 - Math.abs(highestBlock.location.y); rebuildLevel++) {
                        editingBit.setBlockPermutation({ x: x, y: (64 - Math.abs(highestBlock.location.y)) - rebuildLevel, z: x }, world.getDimension("overworld").getBlock({ x: structureBounds.start.x + x, y: highestBlock.location.y - rebuildLevel, z: structureBounds.start.z + z }).permutation)
                    }
                } catch {
                    continue
                }



            }

        }
    }

    return editingBit
}
