import { createRenderer } from "../runtime-core/index";

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevVal, nextVal) {
    // 添加事件，修改属性
    // rule: on 开头 ，第三位 为大写
    // 具体的 click ---> 通用 9 -- -------------
    // on + Event
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if(isOn(key)) {
      // 是事件，添加
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, nextVal);
    }else {
     // 如果 nextVal 变成 underfined 需要把属性删除
      if(nextVal === undefined || nextVal === null) {
        el.removeAttribute(key)
      } else {
        el.setAttribute(key, nextVal)
      }
    }
}

function insert(child, parent,anchor ) {
  parent.append(child)
  // 使用锚点添加到对应的位置
   parent.insertBefore(child, anchor || null )
}
function remove(child) {
  const parent = child.parentNode
  if(parent) {
    parent.removeChild(child)
  }
}

function setElementText (el, text) {
  el.textContent = text
}



const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
})

// 输出一个 createApp， 维持原有的调用
export function createApp (...args) {
  return renderer.createApp(...args)
}

export * from "../runtime-core";
