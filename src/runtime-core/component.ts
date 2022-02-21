import { proxyRefs } from "../reactivity";
import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit";
import { initProps } from "./componentProps"
import { componentPublicInstance } from "./componentPublicInstance"
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode: any, parent) {
  //  记录一下 component 的状态信息
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    el: null,
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMount: false, 
    emit: () => {}
  }
  component.emit = emit.bind(null, component) as any;
  return component
}
export function setupComponent(instance: any) {
  // TODO
  initProps(instance, instance.vnode.props)
  // TODO
  initSlots(instance, instance.vnode.children)
  // 初始化一个有状态的 component
  setupStatefulComponet(instance)
}

function setupStatefulComponet(instance: any) {
  const Component = instance.type
  const { setup } = Component
  // 设置一个代理对象，绑定到render上 ，让render的时候可以获取到变量,所有在 render中的 get操作都会被代理。
  // 从而通过代理 拿到值
  instance.proxy = new Proxy(
    {_: instance},
    componentPublicInstance
   )
  // v3 ，判断是否有核心的数据函数 setup
  if(setup) {
    // 在 setup 的时候 给 currentInstance 赋值
    setCurrentInstance(instance)
    // 可能是 fun, object
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult)

  }
}

function handleSetupResult( instance, setupResult: any) {
  // fn ,obj
  if(typeof setupResult === 'object') {
    //   包裹一下，使得ref 在使用的时候， 直接获取到 proxyRefs
    instance.setupState = proxyRefs(setupResult) 
  }
  // TODO function
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  instance.render = Component.render
}
//  定义一个全局变量  currentInstance  去获取当前的 实例对象 type。
let currentInstance = null
export function getCurrentInstance () {
  return currentInstance
}
// 使用函数包裹，可以方便后续 debugger
function setCurrentInstance (instance) {
  currentInstance = instance
}
