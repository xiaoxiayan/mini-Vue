import { generate } from "./codegen"
import { baseParse } from "./parse"
import { transform } from "./transform"
import { transformElement } from "./transforms/transformElement"
import { transformExpression } from "./transforms/transformExpression"
import { transformText } from "./transforms/transformText"

export function baseCompile(template) {
  const ast:any = baseParse(template)
  // 把ast 树 梳理成 render函数字符串
  transform(ast, {
    nodeTransforms: [ transformExpression , transformElement, transformText ]
  })

  return generate(ast)

}