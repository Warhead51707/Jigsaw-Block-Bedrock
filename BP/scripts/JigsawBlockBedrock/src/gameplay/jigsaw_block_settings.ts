import { world, system, Dimension, Entity } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { JigsawBlockData } from "../types"
import { generate } from "../generator/jigsaw_generator"
import { settings } from "../../settings"

world.afterEvents.playerInteractWithBlock.subscribe(jigsawInteract => {
    if (jigsawInteract.block.typeId != "jigsaw:jigsaw_block") return

    if (jigsawInteract.player.isSneaking) return

    const dimension: Dimension = jigsawInteract.player.dimension
    const dataEntity: Entity = dimension.getEntitiesAtBlockLocation(jigsawInteract.block.location)[0]

    if (dataEntity == undefined || dataEntity.typeId !== "jigsaw:jigsaw_data") {
        console.warn("§dJigsaw Block Bedrock§r (§4Error§r): Matching data entity not found. Try destroying and placing the jigsaw again.")
        return
    }

    const jigsawData: JigsawBlockData = JSON.parse(dataEntity.getDynamicProperty("jigsawData") as string)

    const jigsawForm: ModalFormData = new ModalFormData().title("Jigsaw Block Data")

    jigsawForm.textField("Target pool:", "minecraft:empty", jigsawData.targetPool)
    jigsawForm.textField("Name:", "minecraft:empty", jigsawData.name)
    jigsawForm.textField("Target name:", "minecraft:empty", jigsawData.targetName)
    jigsawForm.textField("Turns into:", "minecraft:air", jigsawData.turnsInto)

    jigsawForm.textField("Selection Priority", "0", jigsawData.selectionPriority.toString())
    jigsawForm.textField("Placement Priority", "0", jigsawData.placementPriority.toString())

    if (jigsawData.blockFace === "up" || jigsawData.blockFace === "down") {
        jigsawForm.dropdown("Joint type:", ["rollable", "aligned"], jigsawData.jointType == "rollable" ? 0 : 1)
    }

    jigsawForm.toggle("Generate", false)

    const incrementAmount = Math.ceil(settings.jigsawMaxLevels / 20) == 0 ? 1 : Math.ceil(settings.jigsawMaxLevels / 20)

    jigsawForm.slider("Levels", 0, settings.jigsawMaxLevels, incrementAmount, 7)

    system.run(() => {
        jigsawForm.show(jigsawInteract.player).then(formData => {
            let shouldGenerate: boolean = false

            if (formData.canceled) return

            jigsawData.targetPool = formData.formValues[0].toString()
            jigsawData.name = formData.formValues[1].toString()
            jigsawData.targetName = formData.formValues[2].toString()
            jigsawData.turnsInto = formData.formValues[3].toString()

            let selectionPriority = parseInt(formData.formValues[4].toString())

            if (isNaN(selectionPriority)) selectionPriority = 0

            jigsawData.selectionPriority = selectionPriority

            let placementPriority = parseInt(formData.formValues[5].toString())

            if (isNaN(placementPriority)) placementPriority = 0

            jigsawData.placementPriority = placementPriority

            if (jigsawData.blockFace === "up" || jigsawData.blockFace === "down") {
                if (formData.formValues[6] === 0) jigsawData.jointType = "rollable"
                else jigsawData.jointType = "aligned"

                shouldGenerate = formData.formValues[7] as boolean

                if (shouldGenerate) jigsawData.levels = formData.formValues[7] as number
            }
            else {
                shouldGenerate = formData.formValues[6] as boolean

                if (shouldGenerate) jigsawData.levels = formData.formValues[7] as number
            }


            dataEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))

            if (shouldGenerate) generate(dataEntity)
        })
    })
})