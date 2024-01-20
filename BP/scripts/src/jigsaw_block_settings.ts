import { world, system, Dimension, Entity } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { JigsawBlockData } from "./types"

let hasOpened = false

world.beforeEvents.playerInteractWithBlock.subscribe(jigsawInteract => {
    if (jigsawInteract.block.typeId != "testing:jigsaw_block") return

    if (jigsawInteract.player.isSneaking) return

    if (hasOpened) return

    if (!hasOpened) hasOpened = true

    const dimension: Dimension = jigsawInteract.player.dimension
    const dataEntity: Entity = dimension.getEntitiesAtBlockLocation(jigsawInteract.block.location)[0]

    if (dataEntity == undefined) {
        world.sendMessage("Warning: Matching data entity not found. Try destroying and placing the jigsaw again.")
        return
    }

    const jigsawData: JigsawBlockData = JSON.parse(dataEntity.getDynamicProperty("jigsawData") as string)

    const jigsawForm: ModalFormData = new ModalFormData().title("Jigsaw Block Data")

    jigsawForm.textField("Target pool:", "minecraft:empty", jigsawData.targetPool)
    jigsawForm.textField("Name:", "minecraft:empty", jigsawData.name)
    jigsawForm.textField("Target name:", "minecraft:empty", jigsawData.targetName)
    jigsawForm.textField("Turns into:", "minecraft:air", jigsawData.turnsInto)

    jigsawForm.dropdown("Joint type:", ["rollable", "aligned"], jigsawData.jointType == "rollable" ? 0 : 1)
    jigsawForm.toggle("Keep? (Only enable after saved)", false)

    system.run(() => {
        jigsawForm.show(jigsawInteract.player).then(formData => {
            hasOpened = false

            if (formData.canceled) return;

            jigsawData.targetPool = formData.formValues[0].toString()
            jigsawData.name = formData.formValues[1].toString()
            jigsawData.targetName = formData.formValues[2].toString()
            jigsawData.turnsInto = formData.formValues[3].toString()
            jigsawData.jointType = formData.formValues[4].toString() as "rollable" | "aligned"
            jigsawData.keep = formData.formValues[5] as boolean

            dataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))
        })
    })
})