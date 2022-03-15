# super-simple-i18n

Simple, lightweight, and easy to use, i18n translation for Node.js for non-production purposes. It supports replacement variables and pluralization. 

## Key features

- **Default Locale** - using the default locale as a fallback
- **Fallback** - returning specified string in case of any error
- **Pluralization** - plural key selection, based on `Intl.PluralRules`
- **Replacement Parameters** - supporting replaceable text through named parameters and consistent replacement
- **Non-throwing errors** - non-disruptive compilation errors
- **Silent mode** - hiding any warning and errors in the console

---

## Getting started

Install the package: `npm i super-simple-i18n`

```js
import { t } form "super-simple-i18n"

// or

import { translate } form "super-simple-i18n"
```

## Options

- `locale : string` - an active locale, _required_
- `defaultLocale : string` - fallback for the active locale
- `content : { [propName: string]: any }` - dictionaries with translations, _required_
- `plural : string | number | undefined` - a pluralisaiton option
- `replacements : string[] | { [propName: string]: string } | undefined` - replacement options
- `fallback : string | undefined` - a string returned in case of errors
- `silent : boolean` - hiding alerts in the console

```js
// Full set of options

t("project.key", {
    locale: 'fr-FR',
    defaultLocale: 'en-EN',
    content: {
        'en-EN': {
            'project.key': 'Hello world!'
        },
        'fr-FR': {
            'project.key': 'Bonjour le monde !'
        }
    },
    plural: undefined,
    replacements: undefined,
    fallback: 'Hello world!',
    silent: false
})
// -> 'Bonjour le monde !'

// Minimum set of options

t("project.key", {
    locale: 'fr-FR',
    content: {
        'en-EN': {
            'project.key': 'Hello world!'
        },
        'fr-FR': {
            'project.key': 'Bonjour le monde !'
        }
    }
})
// -> 'Bonjour le monde !'
```

## Examples

```js
const settings = {
    locale: "en-EN",
    defaultLocale: "en-EN",
    content: {
        "en-EN": {
            string: "Hello world!",
            nested: {
                string: "Hello world!",
                plural: {
                    regular: {
                        one: "Apple!",
                        other: "Apples!",
                    },
                    replace: {
                        array: {
                            one: "Hello %@!",
                            other: "Hello %@ and %@!",
                        },
                        template: {
                            one: "Hello {{name_1}}!",
                            other: "Hello {{name_2}} and {{name_1}}!",
                        }
                    },
                },
                replace: {
                    array: "Hello %d and %d!",
                    template: "Hello {{name_2}} and {{name_1}}!"
                },
            },
        },
    },
}



// Basic

t("string", { ...settings })
// -> 'Hello world!'

t("nested.string", { ...settings })
// -> 'Hello world!'



// Pluralization and replacement

t("nested.plural.regular", {
    ...settings,
    plural: 2
}),
// -> 'Apples!'

t("nested.plural.replace.array", {
    ...settings,
    plural: 2,
    replacements: ["James", "Kate"]
})
// -> 'Hello James and Kate!'

t("nested.plural.replace.template", {
    ...settings,
    plural: 2,
    replacements: {
        name_1: "James",
        name_2: "Kate"
    }
})
// -> 'Hello Kate and James!'

t("nested.replace.array", {
    ...settings,
    replacements: ["James", "Kate"]
})
// -> 'Hello James and Kate!'

t("nested.replace.template", {
    ...settings,
    replacements: {
        name_1: "James",
        name_2: "Kate"
    }
})
// -> 'Hello Kate and James!'
```

## Changelog

- 1.0.0: initial stable release