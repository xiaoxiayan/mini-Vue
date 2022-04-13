import { generate } from "../src/codegen"
import { baseParse } from "../src/parse"
import { transform } from "../src/transform"
import { transformElement } from "../src/transforms/transformElement"
import { transformExpression } from "../src/transforms/transformExpression"

describe('codegen', () => {
  it('string', () => {
       const ast = baseParse('hi')
       // 把ast 树 梳理成 render函数字符串
       transform(ast)
       const {code} = generate(ast)
       // 快照
       expect(code).toMatchSnapshot()
  })
  it('interPolation', () => {
    const ast = baseParse('{{message}}')
    // 把ast 树 梳理成 render函数字符串
    transform(ast, {
      nodeTransforms: [transformExpression]
    })
    const {code} = generate(ast)
    // 快照
    expect(code).toMatchSnapshot()
  })
  it('element', () => {
    const ast = baseParse('<div></div>')
    // 把ast 树 梳理成 render函数字符串
    transform(ast, {
      nodeTransforms: [transformElement]
    })
    const {code} = generate(ast)
    // 快照
    expect(code).toMatchSnapshot()
  })
})