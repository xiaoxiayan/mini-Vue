import { NodeTypes } from "./ast"
const enum TagType {
  Start,
  End
}

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
  const s = context.sourse
  if(s.startsWith('{{')){
     node = parseInterpolation(context)
  } else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }

  if (!node) {
    node = parseText(context)

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

  const rawcontent =  parseTextData(context, rawContentLength)
  const content = rawcontent.trim()
  // 然后继续推进

  advanceBy(context, rawContentLength + closeDelimiter.length)
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

function parseElement(context) {
  const element = parseTag(context, TagType.Start)
  parseTag(context, TagType.End)
  return element
}

function parseTag(context: any, type: TagType) {
    // 1.解析。tag 。正则
    const match:any = /^<\/?([a-z]*)/i.exec(context.sourse)
    const tag = match[1]
    // 2.推进删除代码
    advanceBy(context, match[0].length)
    advanceBy(context, 1)
    if(type === TagType.End) return
    return {
      type: NodeTypes.ELEMENT,
      tag: tag
    }
}

function parseText(context: any): any {
  // 推进， 删除
  const content = parseTextData(context, context.sourse.length)
  console.log(context.sourse.length);
  return {
    type: NodeTypes.TEXT,
    content
  }

}
function parseTextData(context, length) {
  const content = context.sourse.slice(0, length)
  advanceBy(context, length)
  return content
}
