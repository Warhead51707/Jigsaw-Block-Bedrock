import { Player } from '@minecraft/server'
import { JigsawBlockData } from '../types'

export function setMacro(player: Player, data: JigsawBlockData): void {
    player.setDynamicProperty('jigsawMacroData', JSON.stringify(data))
}

export function getMacro(player: Player): JigsawBlockData {
    const data = player.getDynamicProperty('jigsawMacroData')
    if (typeof data != 'string') {
        return undefined
    }
    return JSON.parse(data) as JigsawBlockData
}

export function setMacroEnabled(player: Player, value: boolean): void {
    player.setDynamicProperty('jigsawMacroEnabled', value)
}

export function isMacroEnabled(player: Player): boolean {
    const enabled = player.getDynamicProperty('jigsawMacroEnabled')

    return typeof enabled == 'boolean' && enabled
}