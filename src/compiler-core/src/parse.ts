import { NodeTypes } from "./ast"
const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)
  return createRoot(parseChildren(context, []))
}
// 抽离对象

function createParseContext(content) {
  return {
    sourse: content
  }
}

function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT
  }
}
// ancestors 祖先，收集 标签
function parseChildren(context, ancestors) {
  const nodes: any = []
  while (!isEnd(context, ancestors)) {
  let node
  const s = context.sourse
  // 需要循环取调用解析，直到没有值。
    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
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

function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.Start)
  // 收集出现过的标签
  ancestors.push(element)
  element.children = parseChildren(context, ancestors);
  // 弹出推进过的 标签
  ancestors.pop()
  // 需要判断一下， ancestors 和 当前的 标签相同才 推进。
  if(startsWithEndTagOpen (context.sourse, element.tag)) {
    parseTag(context, TagType.End)
  } else {
      throw new Error(`缺少结束标签:${element.tag}`)
  }
  return element
}
function startsWithEndTagOpen (sourse, tag) {
  return sourse.startsWith('</') && sourse.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
}
function parseTag (context: any, type: TagType) {
  // 1.解析。tag 。正则
  const match: any = /^<\/?([a-z]*)/i.exec(context.sourse)
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
  let endTokens = ['<', '{{']
  for(let i = 0; i < endTokens.length; i++) {
    const index = context.sourse.indexOf(endTokens[i])
    if (index !== -1 && index < endIndex) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)
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
function isEnd(context: any, ancestors) {
  const s = context.sourse
  // 2. 遇到结束标签的时候 , 循环收集过的 ancestors， 如果有相同的就跳出循环，防止死循环

    if ( s.startsWith('</')) {
      for(let i = ancestors.length - 1 ; i >= 0; i-- ) {
        const tag = ancestors[i].tag
        if (startsWithEndTagOpen(s, tag))
           return true
        }
  }
  // 1. sourse 有值的时候
  return !s
}

