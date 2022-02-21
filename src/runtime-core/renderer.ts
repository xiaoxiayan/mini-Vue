import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment, Text } from "./vnode"


export function createRenderer (options) {

 const { createElement, pathProp, insert  } = options
 function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(vnode, container, null)
}

function patch(vnode: any, container: any, parentComponent) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  const { type, shapeFlag } = vnode
  // Fragment -> 只渲染 chilren
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent)
      break;
    case Text:
      processText(vnode, container)
      break;
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
        // TODO processElement
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent)
        }
      break;
  }


}
function processElement(vnode, container, parentComponent) {
  // 分为初始化和 更新
  mountElement(vnode, container, parentComponent)
}
function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent)
}

function mountElement(vnode: any, container: any, parentComponent) {
  // canvs
  // new Element()
  // 挂在不同的平台，canvas ,dom

  const el = (vnode.el = createElement(vnode.type))
  const { children, shapeFlag } = vnode
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent)
  }
 const { props } = vnode
 for (const key in props) {
    let val = props[key]
    // TODO 如果 class是个数组
    if(Array.isArray(val)) {
      let className = ''
      val.map(name => {
        className += name +' '
      })
      val = className
    }
    pathProp(el, key, val)
 }

 insert(el, container)
}


function mountComponent(initialVnode: any, container: any, parentComponent) {
   const instance = createComponentInstance(initialVnode, parentComponent)
   setupComponent(instance)
   setupRenderEffect(instance, initialVnode, container)
}
// 更新 effect
function setupRenderEffect(instance: any, initialVnode, container) {
  // 使用 effect去包裹，在effect中传入函数
  // effect(() => {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode -> patch
    // vnode -> element -> mountElement
    // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
    // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
    patch(subTree, container, instance)
    initialVnode.el = subTree.el
  // })
}

function mountChildren(vnode: any, container: any, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent)
  })
}

function processFragment(vnode: any, container: any, parentComponent) {
  // implement
  mountChildren(vnode, container, parentComponent)
}

 function processText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}
// 返回一个对象，把 render funciton 传过去
//
return {
    createApp: createAppAPI(render)
  }

}
