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
  return vnode
}

function getShapFlag(type: any) {
  return typeof type === 'string'
  ? ShapeFlags.ELEMENT
  : ShapeFlags.STATEFUL_COMPONENT
}
