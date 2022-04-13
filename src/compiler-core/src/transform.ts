import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root, options = {}) {
  const context = createTransformContext(root, options)
  // 1. 遍历- 深度优先搜索
  traverseNode(root, context)

  // 创建 codegen 能直接使用的 codegenNode
  createCodegenNode(root)

  // 在根结点的时候 挂在一个 helper
  root.helpers = [...context.helpers.keys()]
}


function traverseNode(node: any, context) {
  // 取出插入的 方法， 调用。
  const nodeTransforms = context.nodeTransforms
  for(let i = 0; i< nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node, context)
  }
  // 如果节点是 interpolation 插入节点，我们需要挂一个 helpers 的一个相关函数给 codegen，
  // 给 context去设置一个  helpers
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChilren(node, context)
      break;
    default:
      break;
  }

  // 深度优先搜索，遍历树的子节点，

}

function traverseChilren(node: any, context: any) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
      const node = children[i]
      traverseNode(children[i], context)
  }

}

function createTransformContext(root: any, options: any) {
  // 生成一个对象，包含插入方法。
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1)
    }
  }
  return context
}

function createCodegenNode(root: any) {
  root.codegenNode = root.children[0]
}

