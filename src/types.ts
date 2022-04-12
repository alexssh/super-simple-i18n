export type Options = {
    locale: string
    defaultLocale: string
    content: { [locale: string | number]: OptionsContent }
    plural: string | number | undefined
    replacements: ReplacementsArray | ReplacementsTemplate | undefined
    fallback: string | undefined
    silent?: boolean
}

export type OptionsContent = { [key: string | number]: string } | string 

export type Translation = {
    str: OptionsContent | undefined
    key: Key
    content: Content
    defaultContent: Content
    fallback: string
}

export type Key = {
    valid: boolean
    value: string | undefined
    selected: OptionsContent | undefined
    plural: boolean | undefined
    replacements: Replacements | undefined
}

export type Content = {
    valid: boolean
    dict: OptionsContent | undefined
    locale: string | undefined
}

export type Replacements = {
    valid: boolean
    type: string | undefined
}

export type ReplacementsTemplate = { [key: string | number]: string }

export type ReplacementsArray = string[]