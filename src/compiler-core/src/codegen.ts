import { isString } from "../../shared"
import { NodeTypes } from "./ast"
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers"
import { transform } from "./transform"

export function generate(ast) {
  const context = createCodegenContext()
  const { push } = context
  genFuncitonPreamble(ast, context)
  let functionName = 'render'
  let args = ['_ctx', '_cache']
  const signature = args.join(',')
  push(`function ${functionName}(${signature}){`)
  push('return ')
  // 通过 ast 树去获取的 return 内容
  genNode(ast.codegenNode, context)
  push('}')
  return {
    code: context.code
  }
}

function genFuncitonPreamble(ast, context) {
  const { push } = context
  const vueBinging = 'vue'
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
  if (ast.helpers.length > 0) {
    push(`const {${ast.helpers.map(aliasHelper).join(', ')}} = ${vueBinging}`)
  }
  push('\n')
  push('return ')
}

function genNode(node: any, context: any) {
  // 区分node类型，去return 不同的内容
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break;
    case NodeTypes.INTERPOLATION:
      genInterPolation(node, context)
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      getExperssion(node, context)
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break;
    case NodeTypes.COMPUND_EXPRESSION:
      genCompoundExpression(node, context)
      break;
    default:
      break;
  }
}


function genText(node: any, context: any) {
  const { push } = context
  push(`"${node.content}"`)
}

function createCodegenContext() {
  const context = {
    code: '',
    push(sourse) {
      context.code += sourse
    },
    helper(key) {
      return `_${helperMapName[key]}`
    }
  }
  return context
}

function genInterPolation(node: any, context: any) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')

}

function getExperssion(node: any, context: any) {
  // 专门处理表达式的类型
  const { push } = context
  push(`${node.content}`)
}

function genElement(node, context) {
  const { push, helper } = context
  const { tag, children } = node
  console.log('genElement---', children);
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}", null, `)
  // 可以先去循环这个children
  genNode(children, context)
  push(')')
  // 创建新的节点类型， 判断是不是连续的 text, 插值
}

function genCompoundExpression(node: any, context: any) {
  const { push } = context
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}

