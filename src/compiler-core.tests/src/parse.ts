import { NodeTypes } from "./ast"

export function baseParse(content:string) {
  const context = createParseContext(content)
  return createRoot(parseChildren(context))
}
// 抽离对象

function createParseContext(content) {
    return {
      sourse: content
    }
}

function createRoot(children) {
  return {
    children
  }
}
function parseChildren(context) {
  const nodes :any = []
  let node
  if(context.sourse.startsWith('{{')){
     node = parseInterpolation(context)
  }
  nodes.push(node)
  return  nodes
}

function parseInterpolation(context) {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'
  //  {{message}}
  const closeIndex =  context.sourse.indexOf(closeDelimiter, openDelimiter.length)
  // 向前推进
  advanceBy(context, openDelimiter.length)
  // 计算出中间的长度，然后截取
  const rawContentLength = closeIndex - openDelimiter.length

  const rawcontent =  context.sourse.slice(0, rawContentLength)
  const content = rawcontent.trim()
  // 然后继续推进

  advanceBy(context, rawContentLength + closeDelimiter.length)

  console.log('sourse==', context.sourse)
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  }
}

 function advanceBy(context: any, length: number) {
    context.sourse = context.sourse.slice(length)
 }