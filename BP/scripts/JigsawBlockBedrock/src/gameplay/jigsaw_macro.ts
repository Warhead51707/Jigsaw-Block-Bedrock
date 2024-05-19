import { world, system, Entity, Block, Player, BlockRaycastHit } from '@minecraft/server'
import { setMacro, isMacroEnabled, setMacroEnabled } from '../util/macro_utils'

system.afterEvents.scriptEventReceive.subscribe(event => {
    if (event.id != 'jigsaw:macro') return
    if (!event.sourceEntity || !(event.sourceEntity instanceof Player)) return
    const message: string = event.message
    const sender: Player = event.sourceEntity

    if (message == 'create') {
        createMacro(sender)
    }
    if (message == 'enable') {
        enableMacro(sender)
    }
    if (message == 'disable') {
        disableMacro(sender)
    }
    if (message == 'debug') {
        sender.sendMessage(world.getDynamicProperty("jigsaw:terrain_matched_structures") as string)
    }
})

function createMacro(sender: Player) {
    const raycast: BlockRaycastHit = sender.getBlockFromViewDirection({
        blockFilter: {
            includeTypes: ['jigsaw:jigsaw_block']
        },
        includeLiquidBlocks: true,
        includePassableBlocks: true,
        maxDistance: 8
    })
    const block: Block = raycast.block
    if (!block) {
        sender.sendMessage('Failed to set jigsaw macro, no jigsaw block was found in range.')
        return
    }
    const entities: Entity[] = sender.dimension.getEntitiesAtBlockLocation(block.location)
    const jigsawEntity: Entity = entities.find((entity) => {
        return entity.typeId == 'jigsaw:jigsaw_data' && typeof entity.getDynamicProperty('jigsawData') == 'string'
    })
    if (!jigsawEntity) {
        world.sendMessage('Failed to set jigsaw macro, jigsaw data is invalid or missing.')
        return
    }
    setMacro(sender, JSON.parse(jigsawEntity.getDynamicProperty('jigsawData') as string))
    sender.sendMessage('Jigsaw macro created.')
}

function enableMacro(sender: Player) {
    if (isMacroEnabled(sender)) {
        sender.sendMessage('Jigsaw macro is already enabled.')
        return
    }
    setMacroEnabled(sender, true)
    sender.sendMessage('Jigsaw macro successfully enabled.')
}

function disableMacro(sender: Player) {
    if (!isMacroEnabled(sender)) {
        sender.sendMessage('Jigsaw macro is already disabled.')
        return
    }
    setMacroEnabled(sender, false)
    sender.sendMessage('Jigsaw macro successfully disabled.')
}