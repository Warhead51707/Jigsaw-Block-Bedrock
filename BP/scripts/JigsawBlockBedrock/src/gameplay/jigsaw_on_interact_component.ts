import { world, BlockCustomComponent, BlockComponentPlayerInteractEvent, Dimension, Block, Player, Entity, Vector3 } from "@minecraft/server"
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui"
import { JigsawBlockData } from "../types"
import { generate } from "../generator/jigsaw_generator"
import { settings } from "../../settings"

class OnInteractComponent implements BlockCustomComponent {

    public constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this)
    }

    public async onPlayerInteract(event: BlockComponentPlayerInteractEvent): Promise<void> {
        const dimension: Dimension = event.dimension
        const block: Block = event.block
        const player: Player = event.player

        const jigsawEntity = this.findJigsawEntity(dimension, block.location)
        if (!jigsawEntity) return

        const jigsawData: JigsawBlockData = JSON.parse(jigsawEntity.getDynamicProperty("jigsawData") as string)
        const form: ModalFormData = this.createJigsawForm(jigsawData)
        const formResponse: ModalFormResponse = await form.show(player)

        this.finalizeForm(jigsawEntity, jigsawData, formResponse)
    }

    private findJigsawEntity(dimension: Dimension, location: Vector3): Entity {
        const entities = dimension.getEntitiesAtBlockLocation(location)
        return entities.find(entity => entity.typeId == 'jigsaw:jigsaw_data' && typeof entity.getDynamicProperty('jigsawData') == 'string')
    }

    private createJigsawForm(jigsawData: JigsawBlockData): ModalFormData {
        const form = new ModalFormData().title("Jigsaw Block Data")
        form.textField("Target pool:", "minecraft:empty", jigsawData.targetPool)
        form.textField("Name:", "minecraft:empty", jigsawData.name)
        form.textField("Target name:", "minecraft:empty", jigsawData.targetName)
        form.textField("Turns into:", "minecraft:air", jigsawData.turnsInto)
        form.textField("Selection Priority", "0", jigsawData.selectionPriority.toString())
        form.textField("Placement Priority", "0", jigsawData.placementPriority.toString())
        if (jigsawData.blockFace === "up" || jigsawData.blockFace === "down") {
            form.dropdown("Joint type:", ["rollable", "aligned"], jigsawData.jointType == "rollable" ? 0 : 1)
        }
        form.toggle("Generate", false)
        const incrementAmount = Math.ceil(settings.jigsawMaxLevels / 20) == 0 ? 1 : Math.ceil(settings.jigsawMaxLevels / 20)
        form.slider("Levels", 0, settings.jigsawMaxLevels, incrementAmount, 7)
        return form
    }
    
    private finalizeForm(jigsawEntity: Entity, jigsawData: JigsawBlockData, response: ModalFormResponse) {
        let shouldGenerate: boolean = false

        if (response.canceled) return

        jigsawData.targetPool = response.formValues[0].toString()
        jigsawData.name = response.formValues[1].toString()
        jigsawData.targetName = response.formValues[2].toString()
        jigsawData.turnsInto = response.formValues[3].toString()

        let selectionPriority = parseInt(response.formValues[4].toString())

        if (isNaN(selectionPriority)) selectionPriority = 0

        jigsawData.selectionPriority = selectionPriority

        let placementPriority = parseInt(response.formValues[5].toString())

        if (isNaN(placementPriority)) placementPriority = 0

        jigsawData.placementPriority = placementPriority

        if (jigsawData.blockFace === "up" || jigsawData.blockFace === "down") {
            if (response.formValues[6] === 0) jigsawData.jointType = "rollable"
            else jigsawData.jointType = "aligned"
            shouldGenerate = response.formValues[7] as boolean
            if (shouldGenerate) jigsawData.levels = response.formValues[7] as number
        }
        else {
            shouldGenerate = response.formValues[6] as boolean
            if (shouldGenerate) jigsawData.levels = response.formValues[7] as number
        }
        jigsawEntity.setDynamicProperty("jigsawData", JSON.stringify(jigsawData, null, 4))
        if (shouldGenerate) generate(jigsawEntity)
    }
}

world.beforeEvents.worldInitialize.subscribe(event => {
    event.blockTypeRegistry.registerCustomComponent('jigsaw:on_interact', new OnInteractComponent())
})