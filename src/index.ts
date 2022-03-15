import { Options, Content, Key, Translation, Replacements, ReplacementsTemplate, ReplacementsArray } from './types'

const MODULE_NAME: string = '[super-simple-i18n]'
const PLURAL_KEYS: string[] = ['zero', 'one', 'two', 'few', 'many']
const REPLACEMENT_REGEX_TEMPLATE: RegExp = /(?<=\{{).+?(?=\}})/gi
const REPLACEMENT_REGEX_ARRAY: RegExp = /\%d|\%i|\%ld|\%s|%@/i

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
        fallback: options?.fallback ?? ''
    }

    if (!inputKey) {
        !options?.silent && console.warn(`${MODULE_NAME} 'key' is not defined`, { inputKey, options, t })
        return t.fallback
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
            return t.fallback
        }
    }

    if (!options?.content) {
        !options?.silent && console.warn(`${MODULE_NAME} 'options.content' is not defined`, { inputKey, options, t })
        return t.fallback
    } else {
        t.content = getContent(t, options)
    }

    if (t.content.valid) {
        t.key = getKey(t)
        if (t.key.valid) {
            if ((t.key.replacements === undefined) !== t.key.replacements?.valid) {
                if (t.key.plural !== undefined) {
                    if (
                        options?.plural &&
                        (typeof options?.plural === 'string' || typeof options?.plural === 'number')
                    ) {
                        t.str = getPluralFromKey(t, options)

                        if (!t.str.length) {
                            !options?.silent &&
                                console.warn(`${MODULE_NAME} 'options.plural' does not exists in 'key'`, {
                                    inputKey,
                                    options,
                                    t
                                })
                            return t.fallback
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
                        return t.fallback
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
                        return t.fallback
                    }
                }
                return t.str
            } else {
                console.warn(
                    `${MODULE_NAME} 'key' does not have consistent replacements, use {{name}} or - like values`,
                    {
                        inputKey,
                        options,
                        t
                    }
                )
                return t.fallback
            }
        } else {
            console.warn(`${MODULE_NAME} 'content' does not contain 'key'`, {
                inputKey,
                options,
                t
            })
            return t.fallback
        }
    } else {
        !options?.silent &&
            console.warn(`${MODULE_NAME} 'content' does not contain any object matching 'locale' or 'defaultLocale'`, {
                inputKey,
                options,
                t
            })
        return t.fallback
    }
}

//

const getContent = (t: Translation, options: Options): Content => {
    if (options.content.hasOwnProperty(options.locale)) {
        t.content.valid = true
        t.content.dict = options.content[options.locale]
        t.content.locale = options.locale

        return t.content
    }

    if (options.content.hasOwnProperty(options.defaultLocale)) {
        t.content.valid = true
        t.content.dict = options.content[options.defaultLocale]
        t.content.locale = options.defaultLocale

        return t.content
    }

    return t.content
}

const getKey = (t: Translation): Key => {
    if (typeof t.key.value === 'string') {
        t.key.selected = t.content.dict
        t.key = t.key.value.split('.').reduce((prev: Key, current: string): Key => {
            if (prev.valid) {
                if (prev.selected.hasOwnProperty(current)) {
                    return <Key>{
                        ...t.key,
                        valid: true,
                        selected: prev.selected[current]
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
        return Object.keys(key.selected).some((el: any) => (typeof el === 'string' ? PLURAL_KEYS.includes(el) : false))
    }

    return undefined
}

const checkReplacements = (key: Key): Replacements | undefined => {
    if (key.plural) {
        let elements = Object.values(key.selected)
            .map((el: any) => (typeof el === 'string' ? parseReplacements(el) : undefined))
            .filter((el: any) => el !== undefined)

        if (elements.length) {
            return <Replacements>{
                valid: elements.every((el: any) => el.valid),
                type:
                    elements.some((el: any) => (el.type ? el.type.includes('template') : false)) &&
                    elements.some((el: any) => (el.type ? el.type.includes('array') : false))
                        ? undefined
                        : elements.every((el: any) => (el.type ? el.type.includes('template') : false))
                        ? 'template'
                        : elements.every((el: any) => (el.type ? el.type.includes('array') : false))
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
    let template = Boolean(str.match(REPLACEMENT_REGEX_TEMPLATE))
    let array = Boolean(str.match(REPLACEMENT_REGEX_ARRAY))

    return !template && !array
        ? undefined
        : <Replacements>{
              valid: template && array ? false : template || array,
              type: template && array ? undefined : template ? 'template' : array ? 'array' : undefined
          }
}

const getPluralFromKey = (t: Translation, options: Options): string => {
    let pluralKey =
        typeof options.plural === 'string'
            ? options.plural
            : new Intl.PluralRules(t.content.locale).select(<number>options.plural)

    return t.key.selected.hasOwnProperty(pluralKey) ? t.key.selected[pluralKey] : ''
}

const replaceByTemplate = (t: Translation, options: Options): string => {
    const replacementsLink: ReplacementsTemplate | undefined = options?.replacements as ReplacementsTemplate

    return replacementsLink
        ? t.str.match(REPLACEMENT_REGEX_TEMPLATE).reduce((prev: string, current: keyof ReplacementsTemplate) => {
              if (replacementsLink?.hasOwnProperty(current)) {
                  return prev.replace(new RegExp(`{{${current}}}`, 'gi'), String(replacementsLink?.[current]))
              } else {
                  return prev
              }
          }, t.str)
        : t.str
}

const replaceByArray = (t: Translation, options: Options): string => {
    const replacementsLink: ReplacementsArray | undefined = options?.replacements as ReplacementsArray

    return replacementsLink
        ? replacementsLink.reduce((prev: string, current: string) => {
              return prev.replace(REPLACEMENT_REGEX_ARRAY, String(current).trim())
          }, t.str)
        : t.str
}

export const t = translate