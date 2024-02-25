import { world } from '@minecraft/server'

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const block = event.block
    const player = event.player

    if (player.hasTag('debug') && block.typeId == 'jigsaw:jigsaw_block') {
        const states = block.permutation.getAllStates()
        player.sendMessage(JSON.stringify(states, null, 4))
    }
})