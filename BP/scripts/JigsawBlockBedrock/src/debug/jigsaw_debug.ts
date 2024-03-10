import { world, system } from '@minecraft/server'
import { getPlacedBounds } from '../util/jigsaw_generator_utils'

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
world.afterEvents.worldInitialize.subscribe(event => {
    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            if (!player.getTags().includes('jigsaw:debug')) continue

            let boundingBoxes = getPlacedBounds()

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
    }, 30)
})