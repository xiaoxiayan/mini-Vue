import { NodeTypes } from "./ast"

export function transform(root, options) {
  const context = createTransformContext(root, options)
  // 1. 遍历- 深度优先搜索
  traverseNode(root, context)
  // 2. 修改text contetn

}


function traverseNode(node: any, context) {
  console.log('node--->', node)
  // 取出插入的 方法， 调用。
  const nodeTransforms = context.nodeTransforms
  for(let i = 0; i< nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }
  // 深度优先搜索，遍历树的子节点，
  const children = node.children
  if(children) {
     for(let i=0; i< children.length; i++  ) {
       const node = children[i]
       traverseNode(children[i], context)
     }
  }
}

function createTransformContext(root: any, options: any) {
  // 生成一个对象，包含插入方法。
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || []
  }
  return context
}

