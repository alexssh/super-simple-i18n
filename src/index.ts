import { Options, OptionsContent, Content, Key, Translation, Replacements, ReplacementsTemplate, ReplacementsArray } from './types'

const MODULE_NAME = '[super-simple-i18n - 1.0.3]'
const PLURAL_KEYS: string[] = ['zero', 'one', 'two', 'few', 'many']
const REPLACEMENT_REGEX_TEMPLATE = /(?<=\{{).+?(?=\}})/gi
const REPLACEMENT_REGEX_ARRAY = /%d|%i|%ld|%s|%@/i

// Function

export const translate = (inputKey: string, options?: Options): string => {
    
    const content: Content = {
        valid: false,
        dict: undefined,
        locale: undefined
    }

    const key: Key = {
        valid: false,
        value: undefined,
        selected: undefined,
        plural: undefined,
        replacements: undefined
    }

    const t: Translation = {
        str: '',
        key: key,
        content: content,
        defaultContent: content,
        fallback: options?.fallback ?? ''
    }

    const parsed = parseInput(inputKey, t, options)

    return parsed.key.valid ? parsed.str as string : parsed.fallback

}

// Class

export class Translate {
    inputKey: string
    options: Options
    t: Translation

    constructor(inputKey: string, options?: Options) {

        this.inputKey = inputKey
        this.options = options
        this.t = parseInput(
            this.inputKey, 
            {
                str: '',
                key: {
                    valid: false,
                    value: undefined,
                    selected: undefined,
                    plural: undefined,
                    replacements: undefined
                },
                content: {
                    valid: false,
                    dict: undefined,
                    locale: undefined
                },
                defaultContent: {
                    valid: false,
                    dict: undefined,
                    locale: undefined
                },
                fallback: options?.fallback ?? ''
            },
            this.options
        )
    }

    format() {
        return this.t.key.valid ? this.t.str as string : this.t.fallback
    }
}

// Methods

const parseInput = (inputKey: string, t: Translation, options?: Options) => {
    
    if (!inputKey) {
        !options?.silent && console.warn(`${MODULE_NAME} 'key' is not defined`, { inputKey, options, t })
        return t // fb
    } else {
        t.key.valid = true
        t.key.value = inputKey
    }

    if (!options?.locale) {
        if (!options?.defaultLocale) {
            !options?.silent &&
                console.warn(`${MODULE_NAME} 'options.locale' or 'options.defaultLocale' are not defined`, {
                    inputKey,
                    options,
                    t
                })
            return t
        }
    }

    if (!options?.content) {
        !options?.silent && console.warn(`${MODULE_NAME} 'options.content' is not defined`, { inputKey, options, t })
        return t
    } else {
        const res: Content[] = getContent(options)
        t.content = res[0]
        t.defaultContent = res[1]
    }

    if (t.content.valid) {
        t.key = getKey(t, t.content)
        
        if (!t.key.valid && t.defaultContent.valid) {
            t.key.valid = true
            t.key = getKey(t, t.defaultContent)
        }

        if (t.key.valid) {
            if ((t.key.replacements === undefined) !== t.key.replacements?.valid) {
                if (t.key.plural !== undefined) {
                    if (
                        options?.plural &&
                        (typeof options?.plural === 'string' || typeof options?.plural === 'number')
                    ) {
                        const pluralKey = getPlural(t, options)
                        t.str = Object.prototype.hasOwnProperty.call(t.key.selected, pluralKey) ? t.key.selected[pluralKey as keyof OptionsContent] as string : ''

                        if (!t.str.length) {
                            !options?.silent &&
                                console.warn(`${MODULE_NAME} 'options.plural' does not exists in 'key'`, {
                                    inputKey,
                                    options,
                                    t
                                })
                           return t
                        }
                    } else {
                        !options?.silent &&
                            console.warn(
                                `${MODULE_NAME} 'key' is plural, and 'options.plural' is not defined or has wrong type (must be 'string' or 'number')`,
                                {
                                    inputKey,
                                    options,
                                    t
                                }
                            )
                        return t 
                    }
                }

                if (t.key.plural === undefined) {
                    t.str = t.key.selected
                }

                if (t.key.replacements !== undefined) {
                    if (options?.replacements && typeof options?.replacements === 'object') {
                        if (t.key.replacements.type === 'template') {
                            t.str = replaceByTemplate(t, options)
                        }

                        if (t.key.replacements.type === 'array') {
                            t.str = replaceByArray(t, options)
                        }
                    } else {
                        !options?.silent &&
                            console.warn(
                                `${MODULE_NAME} 'key' has replacements, and 'options.replacements' is not defined or has wrong type (must be 'array' or 'object')`,
                                {
                                    inputKey,
                                    options,
                                    t
                                }
                            )
                        return t 
                    }
                }
                return t 
            } else {
                console.warn(
                    `${MODULE_NAME} 'key' does not have consistent replacements, use {{name}} or - like values`,
                    {
                        inputKey,
                        options,
                        t
                    }
                )
               return t 
            }
        } else {
            console.warn(`${MODULE_NAME} 'content' or 'defaultContent' does not contain 'key'`, {
                inputKey,
                options,
                t
            })
           return t 
        }
    } else {
        !options?.silent &&
            console.warn(`${MODULE_NAME} 'content' does not contain any object matching 'locale' or 'defaultLocale'`, {
                inputKey,
                options,
                t
            })
       return t 
    }
}

const getContent = (options: Options): Content[] => {
    const content: Content = { valid: false, dict: undefined, locale: undefined }
    const defaultContent: Content = { valid: false, dict: undefined, locale: undefined }

    if (Object.prototype.hasOwnProperty.call(options.content, options.locale)) {
        content.valid = true
        content.dict = options.content[options.locale]
        content.locale = options.locale
    }

    if (Object.prototype.hasOwnProperty.call(options.content, options.defaultLocale)) {
        defaultContent.valid = true
        defaultContent.dict = options.content[options.defaultLocale]
        defaultContent.locale = options.defaultLocale
    }

    return [content, defaultContent]
}

const getKey = (t: Translation, content : Content): Key => {
    if (typeof t.key.value === 'string') {
        t.key.selected = content.dict
        t.key = t.key.value.split('.').reduce((prev: Key, current: number | string): Key => {
            if (prev.valid) {
                if (Object.prototype.hasOwnProperty.call(prev.selected, current)) {
                    return <Key>{
                        ...t.key,
                        valid: true,
                        selected: prev.selected[current as keyof OptionsContent]
                    }
                } else {
                    return <Key>{
                        ...t.key,
                        valid: false,
                        selected: prev.selected
                    }
                }
            } else {
                return prev
            }
        }, t.key)
    }

    t.key.plural = checkPluralization(t.key)
    t.key.replacements = checkReplacements(t.key)

    return t.key
}

const checkPluralization = (key: Key): boolean | undefined => {
    if (typeof key.selected === 'object' && !key.selected.length) {
        return Object.keys(key.selected).some((el: OptionsContent) => (typeof el === 'string' ? PLURAL_KEYS.includes(el) : false))
    }

    return undefined
}

const checkReplacements = (key: Key): Replacements | undefined => {
    if (key.plural) {
        const elements = Object.values(key.selected as OptionsContent | string)
            .map((el: OptionsContent) => (typeof el === 'string' ? parseReplacements(el) : undefined))
            .filter((el: Replacements) => el !== undefined)

        if (elements.length) {
            return <Replacements>{
                valid: elements.every((el: Replacements) => el.valid),
                type:
                    elements.some((el: Replacements) => (el.type ? el.type.includes('template') : false)) &&
                    elements.some((el: Replacements) => (el.type ? el.type.includes('array') : false))
                        ? undefined
                        : elements.every((el: Replacements) => (el.type ? el.type.includes('template') : false))
                        ? 'template'
                        : elements.every((el: Replacements) => (el.type ? el.type.includes('array') : false))
                        ? 'array'
                        : undefined
            }
        }
    }

    if (typeof key.selected === 'string') {
        return parseReplacements(key.selected)
    }

    return undefined
}

const parseReplacements = (str: string): Replacements | undefined => {
    const template = Boolean(str.match(REPLACEMENT_REGEX_TEMPLATE))
    const array = Boolean(str.match(REPLACEMENT_REGEX_ARRAY))

    return !template && !array
        ? undefined
        : <Replacements>{
              valid: template && array ? false : template || array,
              type: template && array ? undefined : template ? 'template' : array ? 'array' : undefined
          }
}

const getPlural = (t: Translation, options: Options): string => {
    return typeof options.plural === 'string'
            ? options.plural
            : new Intl.PluralRules(t.content.locale).select(options.plural as number)
}

const replaceByTemplate = (t: Translation, options: Options): string => {
    const replacementsLink: ReplacementsTemplate | undefined = options?.replacements as ReplacementsTemplate

    const str = t.str as string

    return replacementsLink
        ? str.match(REPLACEMENT_REGEX_TEMPLATE).reduce((prev: string, current: keyof ReplacementsTemplate) : string => {
              if (Object.prototype.hasOwnProperty.call(replacementsLink, current)) {
                  return prev.replace(new RegExp(`{{${current}}}`, 'gi'), String(replacementsLink?.[current]))
              } else {
                  return prev
              }
          }, str)
        : str
}

const replaceByArray = (t: Translation, options: Options): string => {
    const replacementsLink: ReplacementsArray | undefined = options?.replacements as ReplacementsArray

    return replacementsLink
        ? replacementsLink.reduce((prev: string, current: string) : string => {
              return prev.replace(REPLACEMENT_REGEX_ARRAY, String(current).trim())
          }, t.str as string)
        : t.str as string
}

// Exports

export const t = translate
export const T = Translate
