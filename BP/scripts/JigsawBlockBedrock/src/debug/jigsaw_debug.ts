import { world, system } from '@minecraft/server'
import { getPlacedBounds } from '../util/jigsaw_generator_utils'


//State Debugger
world.afterEvents.playerPlaceBlock.subscribe(event => {
    const block = event.block
    const player = event.player

    if (player.hasTag('debug') && block.typeId == 'jigsaw:jigsaw_block') {
        const states = block.permutation.getAllStates()
        player.sendMessage(JSON.stringify(states, null, 4))
    }
})

//Debug Commands
world.beforeEvents.chatSend.subscribe(event => {
    if (!event.sender.isOp) return

    // Add debug commands here

    if (event.message === '!debug reset_jigsaw_bounds') {
        let placedBoundsLength = 0

        while (true) {
            if (world.getDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength}`) == undefined) break

            world.setDynamicProperty(`jigsaw:placed_bounds_${placedBoundsLength}`, '[]')

            placedBoundsLength++
        }

        event.cancel = true
    }
})


//Structure Bounds Debug
let boundsDebugIndex = 0

world.afterEvents.worldInitialize.subscribe(event => {
    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            if (!player.getTags().includes('debug')) continue

            let boundingBoxes = getPlacedBounds()
            boundingBoxes = boundingBoxes.slice(boundsDebugIndex % boundingBoxes.length, (boundsDebugIndex + 40) % boundingBoxes.length)

            for (const bounds of boundingBoxes) {
                try {
                    for (let x = 0; x <= bounds.size.x; x++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y,
                            z: bounds.start.z + bounds.size.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + bounds.size.z,
                        })
                    }

                    for (let z = 0; z <= bounds.size.z; z++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + bounds.size.y,
                            z: bounds.start.z + z,
                        })
                    }

                    for (let y = 0; y <= bounds.size.y; y++) {
                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z + bounds.size.z,
                        })

                        player.dimension.spawnParticle('jigsaw:border_dust', {
                            x: bounds.start.x + bounds.size.x,
                            y: bounds.start.y + y,
                            z: bounds.start.z + bounds.size.z,
                        })
                    }
                } catch { }
            }
        }

        boundsDebugIndex += 40
    }, 2)
})