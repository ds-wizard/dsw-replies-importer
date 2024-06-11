const KEY_KM = 'knowledgeModel'
const KEY_ENTITIES = 'entities'
const KEY_REPLIES = 'questionnaireReplies'
const KEY_VALUE = 'value'
const KEY_TYPE = 'type'
const KEY_ID = 'id'
const KEYS_VERSION = ['templateMetamodelVersion', 'documentTemplateMetamodelVersion']

function stringifyPath(path) {
    return path.join(".")
}

function extractReply(data, path) {
    return data[KEY_REPLIES][stringifyPath(path)]
}

function extractKey(data, keys) {
    for (let i = 0; i < keys.length; i++) {
        if (data[keys[i]]) {
            return data[keys[i]]
        }
    }
    return undefined
}

export default class RepliesImporter {

    constructor(importer) {
        this.importer = importer
        this.error = null
    }
    
    importAnswer(path, newPath, data, answerUuid) {
        const answer = data[KEY_KM][KEY_ENTITIES]['answers'][answerUuid]
        if (answer === undefined) {
            return
        }
        answer['followUpUuids'].forEach((questionUuid) => {
            this.importQuestion([...path, answerUuid], [...newPath, answerUuid], data, questionUuid)
        })
    }

    importQuestionList(path, newPath, data, question) {
        const reply = extractReply(data, path)
        if (reply !== undefined) {
            const items = reply[KEY_VALUE][KEY_VALUE]
            items.forEach((itemUuid) => {
                const newItemUuid = this.importer.addItem(newPath)
                question['itemTemplateQuestionUuids'].forEach((questionUuid) => {
                    this.importQuestion([...path, itemUuid], [...newPath, newItemUuid], data, questionUuid)
                })
            })
        }
    }

    importQuestionValue(path, newPath, data, question) {
        const reply = extractReply(data, path)
        if (reply !== undefined) {
            this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
        }
    }

    importQuestionIntegration(path, newPath, data, question) {
        const reply = extractReply(data, path)
        if (reply !== undefined) {
            const integrationReply = reply[KEY_VALUE][KEY_VALUE]
            const replyValue = integrationReply[KEY_VALUE]
            const replyType = integrationReply[KEY_TYPE]
            if (replyType === 'IntegrationType') {
                const replyId = integrationReply[KEY_ID]
                this.importer.setIntegrationReply(newPath, replyValue, replyId)
            } else {
                this.importer.setReply(newPath, replyValue)
            }
        }
    }

    importQuestionOptions(path, newPath, data, question) {
        const reply = extractReply(data, path)
        if (reply !== undefined) {
            this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
        }
        question['answerUuids'].forEach((answerUuid) => {
            this.importAnswer(path, newPath, data, answerUuid)
        })
    }

    importQuestionMultiChoice(path, newPath, data, question) {
        const reply = extractReply(data, path)
        if (reply !== undefined) {
            this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
        }
    }

    importQuestion(path, newPath, data, questionUuid) {
        const question = data[KEY_KM][KEY_ENTITIES]['questions'][questionUuid]
        if (question === undefined) {
            return
        }
        switch (question['questionType']) {
            case 'OptionsQuestion':
                this.importQuestionOptions([...path, questionUuid], [...newPath, questionUuid], data, question)
                break
            case 'ValueQuestion':
                this.importQuestionValue([...path, questionUuid], [...newPath, questionUuid], data, question)
                break
            case 'ListQuestion':
                this.importQuestionList([...path, questionUuid], [...newPath, questionUuid], data, question)
                break
            case 'IntegrationQuestion':
                this.importQuestionIntegration([...path, questionUuid], [...newPath, questionUuid], data, question)
                break
            case 'MultiChoiceQuestion':
                this.importQuestionMultiChoice([...path, questionUuid], [...newPath, questionUuid], data, question)
                break
        }
    }

    importChapter(data, chapterUuid) {
        const chapter = data[KEY_KM][KEY_ENTITIES]['chapters'][chapterUuid]
        if (chapter === undefined) {
            return
        }
        chapter['questionUuids'].forEach((questionUuid) => {
            this.importQuestion([chapterUuid], [chapterUuid], data, questionUuid)
        })
    }

    importProject(data) {
        data[KEY_KM]['chapterUuids'].forEach((chapterUuid) => {
            this.importChapter(data, chapterUuid)
        })
    }

    checkSupported(data) {
        try {
            const metamodelVersion = extractKey(data, KEYS_VERSION)
            if (4 <= metamodelVersion && metamodelVersion <= 13) {
                return true
            }
            this.error = `Unsupported metamodel version: ${metamodelVersion}`
        } catch (e) {
            this.error = 'Unknown metamodel version (wrong JSON file).'
        }
        return false
    }

    import(data) {
        if (!this.checkSupported(data)) {
            throw 'Unsupported data provided.'
        }
        this.importProject(data)
    }

}
