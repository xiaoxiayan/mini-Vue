import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment, Text } from "./vnode"


export function createRenderer (options) {
 const {
   createElement,
   patchProp:hostPatchProp,
   insert
  } = options
 function render(vnode, container) {
  // 调用 patch， 方便后续的递归
  patch(null, vnode, container, null)
}

function patch(n1, n2: any, container: any, parentComponent) {
  // 处理组件
  // 判断类型 类型主要分为两种，一种是 component 类型
  // render { component } vue文件都是组件类型
  const { type, shapeFlag } = n2
  // Fragment -> 只渲染 chilren
  switch (type) {
    case Fragment:
      processFragment(n1, n2, container, parentComponent)
      break;
    case Text:
      processText(n1, n2, container)
      break;
    default:
      if(shapeFlag & ShapeFlags.ELEMENT) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent)
        }
      break;
  }


}
function processElement(n1, n2, container, parentComponent) {
  // 分为初始化和 更新
  if(!n1) {
    mountElement(n2, container, parentComponent)
  } else {
    patchElement(n1, n2, container)
  }
}
function processComponent(n1, n2: any, container: any, parentComponent) {
  mountComponent(n2, container, parentComponent)
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
    hostPatchProp(el, key, val)
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
  effect(() => {

    // vnode -> patch
    // vnode -> element -> mountElement
    // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
    // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
    if(!instance.isMount) {
      console.log('init')
      // 初始化
      const { proxy  } = instance
      const subTree = (instance.subTree =  instance.render.call(proxy))
      patch(null, subTree, container, instance)
      initialVnode.el = subTree.el
      instance.isMount = true
    } else {
      // 对比两个树
      console.log('update')
      const { proxy  } = instance
      const prevSubTree = instance.subTree
      const subTree = instance.render.call(proxy)
      instance.subTree = subTree

      patch(prevSubTree, subTree, container, instance)
      // if(subTree !== prevSubTree)
    }
  })
}

function patchElement (n1, n2, container) {
  // 处理更新逻辑。props , element
  console.log('n1', n1)
  console.log('n2', n2)
}

function mountChildren(vnode: any, container: any, parentComponent) {
  vnode.children.forEach((v) => {
    patch( null, v, container, parentComponent)
  })
}

function processFragment(n1, n2: any, container: any, parentComponent) {
  // implement
  mountChildren(n2, container, parentComponent)
}

 function processText(n1, n2: any, container: any) {
  const { children } = n2
  const textNode = (n2.el = document.createTextNode(children))
  container.append(textNode)
}
// 返回一个对象，把 render funciton 传过去
//
return {
    createApp: createAppAPI(render)
  }

}
