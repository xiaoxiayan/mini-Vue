import typescript from "@rollup/plugin-typescript"
export default {
    input: "./src/index.ts",
    output: [
        // 1. cjs -> node.js commonjs
        // 2. esm
        {
          format: "cjs",
          file: "lib/gg-mini-vue.cjs.js"
        },
        {
          format: "es",
          file: "lib/gg-mini-vue.esm.js"
        },
    ],
    plugins: [typescript()],
}