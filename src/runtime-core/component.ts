export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.tyoe
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

  if(setup) {
    // 可能是 fun, object
    const setupResult = setup()
    handleSetupResult(instance, setupResult)

  }
}

function handleSetupResult( instance, setupResult: any) {
  // fn ,obj
  // TODO function
  if(typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  const Component = instance.type

  if(!Component.render) {
    Component.render = instance.render
  }
}

