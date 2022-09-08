import DSWImporter from '@ds-wizard/importer-sdk'
import RepliesImporter from './importer'

function runImporter() {
    const importer = new DSWImporter()

    importer
        .init()
        .then(() => {
            const fileSelector = document.getElementById('file-input')
            fileSelector.addEventListener('change', (event) => {
                const fileList = event.target.files
                console.log(fileList)
                if (fileList.length !== 1) {
                    alert('File not selected...')
                    return
                }
                const file = fileList[0]

                const reader = new FileReader()
                reader.addEventListener('load', (event) => {
                    let data = null
                    try {
                        data = JSON.parse(event.target.result)
                    } catch (error) {
                        showError('Failed to parse JSON file.')
                        return
                    }

                    const processor = new RepliesImporter(importer)
                    try {
                        processor.import(data)
                    } catch (error) {
                        console.log(error)
                        if (processor.error !== null) {
                            showError(processor.error)
                        } else {
                            showError('Failed to import replies from JSON.')
                        }
                        return
                    }
                    try {
                        importer.send()
                    } catch (error) {
                        showError('Failed to send data back to the Wizard.')
                    }
                })
                reader.readAsText(file)
            })
        })
        .catch(error => {
            console.error(error)
            throw error
        })
}

function showError(message) {
    const errorDiv = document.getElementById('error')
    const errorAlert = document.getElementById('error-alert')
    errorAlert.textContent = message
    errorDiv.classList.toggle('hidden')
}

window.addEventListener('load', (event) => {
    runImporter()
})
