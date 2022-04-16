import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPUND_EXPRESSION
}

export function createVnodeCall (context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE)
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children
  }
}