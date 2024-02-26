import { world, Dimension, Entity, Block, Vector3, system } from '@minecraft/server'
import { JigsawBlockData, JigsawMacroData } from './types'


export function getMacroData(): JigsawMacroData[] {
    try {
        return JSON.parse(world.getDynamicProperty('jigsaw:macro_data') as string)
    } catch (err) {
        return undefined
    }
}

function setMacroData(data: JigsawMacroData[]): void {
    world.setDynamicProperty("jigsaw:macro_data", JSON.stringify(data, null, 4))
}

world.beforeEvents.chatSend.subscribe(chatMsg => {
    if (!chatMsg.sender.isOp) return

    if (!chatMsg.message.startsWith("!jigsaw macro ")) return

    const subcommands: string[] = ["create", "enable", "disable"]

    const subcommand: string = chatMsg.message.split(" ")[2]

    chatMsg.cancel = true

    if (!subcommands.includes(subcommand)) {
        chatMsg.sender.sendMessage(`Subcommand '${subcommand}' not found.`)

        return
    }

    const macroData: JigsawMacroData[] = getMacroData()

    if (subcommand == "create") {
        const sourceJigsaw: Block = chatMsg.sender.getBlockFromViewDirection().block

        if (sourceJigsaw.typeId !== "jigsaw:jigsaw_block") return

        if (getMacroData() == undefined) {
            setMacroData([])
        }

        const sourceJigsawEntityData: JigsawBlockData = JSON.parse(((chatMsg.sender.dimension.getEntitiesAtBlockLocation(sourceJigsaw.location)[0] as Entity).getDynamicProperty("jigsawData") as string))

        const jigsawMacroData: JigsawMacroData = {
            macroEnabled: true,
            macroOwner: chatMsg.sender.name,
            name: sourceJigsawEntityData.name,
            targetName: sourceJigsawEntityData.targetName,
            targetPool: sourceJigsawEntityData.targetPool,
            jointType: sourceJigsawEntityData.jointType,
            turnsInto: sourceJigsawEntityData.turnsInto
        }

        // world.sendMessage(JSON.stringify(jigsawMacroData, null, 4))

        for (const macro of macroData) {
            if (macro.macroOwner == chatMsg.sender.name) {
                const index = macroData.indexOf(macro)

                macroData.splice(index, 1)

                break
            }
        }

        macroData.push(jigsawMacroData)

        chatMsg.sender.sendMessage("Jigsaw macro created.")

        world.setDynamicProperty("jigsaw:macro_data", JSON.stringify(macroData, null, 4))

        return
    }

    if (subcommand == "enable" || subcommand == "disable") {
        let foundMacro = false

        for (const macro of macroData) {
            if (macro.macroOwner === chatMsg.sender.name) {

                macro.macroEnabled = subcommand == "enable" ? true : false

                foundMacro = true
                break
            }
        }

        if (!foundMacro) {
            chatMsg.sender.sendMessage("No matching macro found.")
            return
        }

        setMacroData(macroData)

        chatMsg.sender.sendMessage(`Macro ${subcommand == "enable" ? "enabled" : "diabled"}.`)

        return
    }
})