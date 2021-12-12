import { ShapeFlags } from "../shared/shapeFlags"

export function createVNode(type, props?, children?) {

  const vnode = {
    type,
    props,
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

function getShapFlag(type: any) {
  return typeof type === 'string'
  ? ShapeFlags.ELEMENT
  : ShapeFlags.STATEFUL_COMPONENT
}
