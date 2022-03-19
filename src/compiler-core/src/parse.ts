import { NodeTypes } from "./ast"
const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)
  return createRoot(parseChildren(context, ''))
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
function parseChildren(context, endTag) {
  const nodes: any = []
  while (!isEnd(context, endTag)) {
  let node
  const s = context.sourse
  console.log('parseChildren----', s)
  // 需要循环取调用解析，直到没有值。
    if (s.startsWith('{{')) {
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
  }
  return nodes
}

function parseInterpolation(context) {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'
  //  {{message}}
  const closeIndex = context.sourse.indexOf(closeDelimiter, openDelimiter.length)
  // 向前推进
  advanceBy(context, openDelimiter.length)
  // 计算出中间的长度，然后截取
  const rawContentLength = closeIndex - openDelimiter.length
  const rawcontent = parseTextData(context, rawContentLength)
  const content = rawcontent.trim()
  // 然后继续推进
  console.log(context.sourse, rawContentLength + closeDelimiter.length, '长度')
  advanceBy(context, closeDelimiter.length)
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
  const element: any = parseTag(context, TagType.Start)
  element.children = parseChildren(context, element.tag);
  parseTag(context, TagType.End)
  return element
}

function parseTag(context: any, type: TagType) {
  // 1.解析。tag 。正则
  const match: any = /^<\/?([a-z]*)/i.exec(context.sourse)
  console.log('parseTag', context)
  const tag = match[1]
  // 2.推进删除代码
  advanceBy(context, match[0].length)
  advanceBy(context, 1)
  if (type === TagType.End) return
  return {
    type: NodeTypes.ELEMENT,
    tag: tag
  }
}

function parseText(context: any): any {
  // 推进， 删除
  let endIndex = context.sourse.length
  let endTokens = ['{{', '<']
  for(let i = 0; i < endTokens.length; i++) {
    const index = context.sourse.indexOf(endTokens[i])
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)
  console.log('parseText', content);
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
function isEnd(context: any, parentTag) {
  const s = context.sourse
  // 2. 遇到结束标签的时候
  if (parentTag && s.startsWith(`</${parentTag}>`)) {
    return true
  }
  // 1. sourse 有值的时候
  return !s

}

