export type Options = {
    locale: string
    defaultLocale: string
    content: { [propName: string]: any }
    plural: string | number | undefined
    replacements: ReplacementsArray | ReplacementsTemplate | undefined
    fallback: string | undefined
    silent?: boolean
}

export type Translation = {
    str: any
    key: Key
    content: Content
    fallback: string
}

export type Key = {
    valid: boolean
    value: string | undefined
    selected: any | undefined
    plural: boolean | undefined
    replacements: Replacements | undefined
}

export type Content = {
    valid: boolean
    dict: any
    locale: string | undefined
}

export type Replacements = {
    valid: boolean
    type: string | undefined
}

export type ReplacementsTemplate = { [propName: string]: string }

export type ReplacementsArray = string[]