import { NodeTypes } from "../ast";

export function transformExpression (node) {
    if (node.type === NodeTypes.INTERPOLATION) {
       node.content = proessExpression(node.content)
    }
}
function proessExpression(node: any) {
  node.content = `_ctx.${node.content}`
  return node
}

