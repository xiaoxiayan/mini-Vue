import { ShapeFlags } from "../shared/shapeFlags"
export const Fragment = Symbol('Fragment')  // slot 的类型
export const Text = Symbol('Text')

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    key:  props && props.key? props.key : null ,
    shapeFlag: getShapFlag(type),
    children
  }
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  // 判断是否为 slot类型， 组件 + children Object
  if(vnode.shapeFlag && ShapeFlags.STATEFUL_COMPONENT) {
    if(typeof children === 'object') {
      vnode.shapeFlag !== ShapeFlags.SLOT_CHILDREN
    }
  }
  return vnode
}

export function createTextVNode(text:string) {
  return createVNode(Text, {}, text)
}

function getShapFlag(type: any) {
  return typeof type === 'string'
  ? ShapeFlags.ELEMENT
  : ShapeFlags.STATEFUL_COMPONENT
}
