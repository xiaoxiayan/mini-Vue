import { componentPublicInstance } from "./componentPublicInstance"

export function createComponentInstance(vnode: any) {
  //  记录一下 component 的状态信息
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    el: null,
  }
  return component
}
export function setupComponent(instance: any) {
  // TODO
  // initProps()
  // TODO
  // initSlots()
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
    // 可能是 fun, object
    const setupResult = setup()
    handleSetupResult(instance, setupResult)

  }
}

function handleSetupResult( instance, setupResult: any) {
  // fn ,obj
  if(typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  // TODO function

  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type
  instance.render = Component.render
}
