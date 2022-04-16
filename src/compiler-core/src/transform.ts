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
  const exitFns: any = []

  for(let i = 0; i< nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)
    if(onExit) exitFns.push(onExit)
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
  let i = exitFns.length
  while(i--) {
    exitFns[i]()
  }

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
  // 如果类型是 element 的， 我们直接使用 element上面的 codegenNode
  const child = root.children[0]
  if(child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
      root.codegenNode = root.children[0]
  }
}

