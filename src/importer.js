const KEY_ENTITIES = 'entities'
const KEY_VALUE = 'value'
const KEY_TYPE = 'type'
const KEY_ID = 'id'
const KEY_RAW = 'raw'
const KEYS_VERSION = ['metamodelVersion', 'templateMetamodelVersion', 'documentTemplateMetamodelVersion']

function stringifyPath(path) {
    return path.join(".")
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
        this.replies = {}
        this.km = {}
        this.itemUuids = new Map();
    }

    extractReply(path) {
        return this.replies[stringifyPath(path)]
    }
    
    importAnswer(phase, path, newPath, answerUuid) {
        const answer = this.km[KEY_ENTITIES]['answers'][answerUuid]
        if (answer === undefined) {
            return
        }
        answer['followUpUuids'].forEach((questionUuid) => {
            this.importQuestion(phase, [...path, answerUuid], [...newPath, answerUuid], questionUuid)
        })
    }

    importQuestionList(phase, path, newPath, question) {
        const reply = this.extractReply(path)
        if (reply !== undefined) {
            const items = reply[KEY_VALUE][KEY_VALUE]
            items.forEach((itemUuid) => {
                if (phase === 1) {
                    const createdItemUuid = this.importer.addItem(newPath)
                    this.itemUuids.set(itemUuid, createdItemUuid)
                }

                const newItemUuid = this.itemUuids.get(itemUuid)
                question['itemTemplateQuestionUuids'].forEach((questionUuid) => {
                    this.importQuestion(phase, [...path, itemUuid], [...newPath, newItemUuid], questionUuid)
                })
            })
        }
    }

    importQuestionValue(phase, path, newPath, question) {
        if (phase === 1) {
            const reply = this.extractReply(path)
            if (reply !== undefined) {
                this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
            }
        }
    }

    importQuestionIntegration(phase, path, newPath, question) {
        if (phase === 1) {
            const reply = this.extractReply(path)
            if (reply !== undefined) {
                const integrationReply = reply[KEY_VALUE][KEY_VALUE]
                const replyValue = integrationReply[KEY_VALUE]
                const replyType = integrationReply[KEY_TYPE]
                if (replyType === 'IntegrationType') {
                    const replyRaw = integrationReply[KEY_RAW]
                    this.importer.setIntegrationReply(newPath, replyValue, replyRaw)
                } else if (replyType === 'IntegrationLegacyType') {
                    const replyId = integrationReply[KEY_ID]
                    this.importer.setIntegrationLegacyReply(newPath, replyValue, replyId)
                } else {
                    this.importer.setReply(newPath, replyValue)
                }
            }
        }
    }

    importQuestionOptions(phase, path, newPath, question) {
        if (phase === 1) {
            const reply = this.extractReply(path)
            if (reply !== undefined) {
                this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
            }
        }
        question['answerUuids'].forEach((answerUuid) => {
            this.importAnswer(phase, path, newPath, answerUuid)
        })
    }

    importQuestionMultiChoice(phase, path, newPath, question) {
        if (phase === 1) {
            const reply = this.extractReply(path)
            if (reply !== undefined) {
                this.importer.setReply(newPath, reply[KEY_VALUE][KEY_VALUE])
            }
        }
    }

    importQuestionItemSelect(phase, path, newPath, question) {
        if (phase === 2) {
            const reply = this.extractReply(path)
            if (reply !== undefined) {
                const itemUuid = reply[KEY_VALUE][KEY_VALUE]
                const newItemUuid = this.itemUuids.get(itemUuid)
                this.importer.setItemSelectReply(newPath, newItemUuid)
            }
        }
    }

    importQuestion(phase, path, newPath, questionUuid) {
        const question = this.km[KEY_ENTITIES]['questions'][questionUuid]
        if (question === undefined) {
            return
        }
        switch (question['questionType']) {
            case 'OptionsQuestion':
                this.importQuestionOptions(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
            case 'ValueQuestion':
                this.importQuestionValue(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
            case 'ListQuestion':
                this.importQuestionList(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
            case 'IntegrationQuestion':
                this.importQuestionIntegration(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
            case 'MultiChoiceQuestion':
                this.importQuestionMultiChoice(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
            case 'ItemSelectQuestion':
                this.importQuestionItemSelect(phase, [...path, questionUuid], [...newPath, questionUuid], question)
                break
        }
    }

    importChapter(phase, chapterUuid) {
        const chapter = this.km[KEY_ENTITIES]['chapters'][chapterUuid]
        if (chapter === undefined) {
            return
        }
        chapter['questionUuids'].forEach((questionUuid) => {
            this.importQuestion(phase, [chapterUuid], [chapterUuid], questionUuid)
        })
    }

    importProject(phase) {
        this.km['chapterUuids'].forEach((chapterUuid) => {
            this.importChapter(phase, chapterUuid)
        })
    }

    loadData(data) {
        try {
            const metamodelVersion = parseFloat(extractKey(data, KEYS_VERSION))
            if (4 <= metamodelVersion && metamodelVersion < 18.0) {
                if (metamodelVersion >= 14) {
                    this.km = data['knowledgeModel']
                    this.replies = data['questionnaire']['replies']
                } else {
                    this.km = data['knowledgeModel']
                    this.replies = data['questionnaireReplies']
                }

                return true
            }
            this.error = `Unsupported metamodel version: ${metamodelVersion}`
        } catch (e) {
            this.error = 'Unknown metamodel version (wrong JSON file).'
        }
        return false
    }

    import(data) {
        if (!this.loadData(data)) {
            throw 'Unsupported data provided.'
        }
        this.importProject(1)  // Phase 1: import all and create items
        this.importProject(2)  // Phase 2: import item select (new item UUIDs prepared)
    }
}
