import { join, resolve } from "path"
import esbuild from "esbuild"
import { globby } from "globby"
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const color = (n, v) => `\x1b[${n}m${v}\x1b[0m`

const defaultSource = join(process.cwd(), "src")
const defaultOutdir = join(process.cwd(), "dist")

async function getOptions(path) {
    const entryPoints = await globby([`${path}/*.ts`])

    return {
        entryPoints,
        minify: true,
        format: "esm",
        bundle: true,
        target: ["es2020"],
        plugins: [nodeExternalsPlugin()]
    }
}

async function build(path = defaultSource, outdir = defaultOutdir) {
    outdir = resolve(outdir)
    await esbuild.build({
        outdir,
        ...(await getOptions(path))
    })

    console.log(`Build done at ${outdir}`)
}

async function server(path = defaultPath, port = 8000) {
    function onRequest(info) {
        const status = color(info.status.toString().startsWith("2") ? 32 : 31, info.status)
        const line = color(37, `${info.method} ${status} ${info.path} [${info.timeInMS}ms]`)
        console.log(line)
    }

    await esbuild.serve({ port, onRequest }, {...await getOptions(path), minify: false})
    console.log(`Server listening at http://127.0.0.1:${port}`)
}

let [a, b, command, path, option] = process.argv

path = path && resolve(join(process.cwd(), path))

switch (command) {
    case "server":
        server(path, option && parseInt(option))
        break
    case "build":
        build(path, option && resolve(join(process.cwd(), option)))
        break
}
