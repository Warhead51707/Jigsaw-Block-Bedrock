const fs = require("fs")
const path = require('path')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

console.log("Thank you for downloading the Jigsaw Block Bedrock library! To begin the transfer, please enter the following data:\n\n")

const user = {
    behPath: null,
    resPath: null,
    includeTests: false
}

readline.question("Please enter the path to your project's behavior pack: ", userBehPackPath => {
    if (!fs.existsSync(userBehPackPath)) {
        console.log("\nError: Invalid behavior pack path: " + userBehPackPath)
        return
    }

    userBehPackPath = userBehPackPath.replaceAll("\\", "/")

    user.behPath = userBehPackPath

    readline.question("Please enter the path to your project's resource pack: ", userResPackPath => {
        if (!fs.existsSync(userResPackPath)) {
            console.log("\nError: Invalid resource pack path: " + userResPackPath)
            return
        }

        userResPackPath = userResPackPath.replaceAll("\\", "/")

        user.resPath = userResPackPath

        readline.question("Include test structures (Y or N): ", yesNo => {
            if (yesNo.toLowerCase() === "y") user.includeTests = true

            function copyFolderPasteToTarget(source, target, isScripts = false) {
                const files = fs.readdirSync(source)

                if (!fs.existsSync(target)) {
                    fs.mkdirSync(target)
                }

                files.forEach(file => {
                    const currentSource = path.join(source, file)
                    const currentTarget = path.join(target, file)

                    if (fs.lstatSync(currentSource).isDirectory()) {
                        copyFolderPasteToTarget(currentSource, currentTarget)
                    } else {
                        if (!isScripts) fs.copyFileSync(currentSource, currentTarget)
                    }
                })
            }

            // Beh pack
            copyFolderPasteToTarget("./BP/blocks", `${user.behPath}/blocks`)
            copyFolderPasteToTarget("./BP/entities", `${user.behPath}/entities`)
            copyFolderPasteToTarget("./BP/scripts", `${user.behPath}/scripts`, true)

            if (user.includeTests) copyFolderPasteToTarget("./BP/structures", `${user.behPath}/structures`)

            // Res pack
            copyFolderPasteToTarget("./RP/ui", `${user.resPath}/ui`)
            copyFolderPasteToTarget("./RP/textures/blocks", `${user.resPath}/textures/blocks`)
            copyFolderPasteToTarget("./RP/models", `${user.resPath}/models`)
            copyFolderPasteToTarget("./RP/particles", `${user.resPath}/particles`)
            

            if (!fs.existsSync(`${user.behPath}/manifest.json`)) {
                console.log("Error: No behavior manifest file found at: " + `${user.behPath}/manifest.json`)
                return
            }

            const userManifestFile = JSON.parse(fs.readFileSync(`${user.behPath}/manifest.json`))

            const userEntryScriptFile = fs.readFileSync(`${user.behPath}/${userManifestFile.modules.find(module => module.type == "script").entry}`)

            const editedUserEntryScript = `import "./jigsawBlockBedrock/src/smart_queue"\nimport "./jigsawBlockBedrock/src/jigsaw_block_settings"\nimport "./jigsawBlockBedrock/src/jigsaw_data_entity_handler"\nimport "./jigsawBlockBedrock/src/jigsaw_generator"\n${userEntryScriptFile}`

            fs.writeFileSync(`${user.behPath}/${userManifestFile.modules.find(module => module.type == "script").entry}`, editedUserEntryScript)

            if (!fs.existsSync(`${user.resPath}/textures/terrain_texture.json`)) {
                console.log("Error: No terrain textures file found at: " + `${user.resPath}/textures/terrain_texture.json`)
                return
            }

            const userTerrainTexture = JSON.parse(fs.readFileSync(`${user.resPath}/textures/terrain_texture.json`))

            userTerrainTexture.texture_data = Object.assign({}, userTerrainTexture.texture_data, JSON.parse(fs.readFileSync("./RP/textures/terrain_texture.json")).texture_data)

            fs.writeFileSync(`${user.resPath}/textures/terrain_texture.json`, JSON.stringify(userTerrainTexture, null, 4))

            const jigsawLang = fs.readFileSync("./RP/texts/en_US.lang")

            if (!fs.existsSync(`${user.resPath}/texts/en_US.lang`)) {
                console.log("Error: No lang file found at: " + `${user.resPath}/texts/en_US.lang`)
                return
            }

            const userLang = fs.readFileSync(`${user.resPath}/texts/en_US.lang`)

            const combinedLang = `${userLang}\n${jigsawLang}`

            fs.writeFileSync(`${user.resPath}/texts/en_US.lang`, combinedLang)

            console.log("\nTransfer complete.")
            readline.close()
        })
    })
})
