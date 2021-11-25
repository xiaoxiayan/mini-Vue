function createComponentInstance(vnode) {
    //  记录一下 component 的状态信息
    var component = {
        vnode: vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // TODO
    // initSlots()
    // 初始化一个有状态的 component
    setupStatefulComponet(instance);
}
function setupStatefulComponet(instance) {
    var Component = instance.type;
    var setup = Component.setup;
    // v3 ，判断是否有核心的数据函数 setup
    if (setup) {
        // 可能是 fun, object
        var setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // fn ,obj
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    // TODO function
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // 调用 patch， 方便后续的递归
    patch(vnode);
}
function patch(vnode, container) {
    // 处理组件
    // 判断类型 类型主要分为两种，一种是 component 类型
    // render { component } vue文件都是组件类型
    processComponent(vnode);
    //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
    // TODO processElement
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    var instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    var subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            // vue3 把所有东西转换成 vnode
            // component -> vnode
            // 所有操作 基于 vnode 处理
            var vnode = createVNode(rootComponent);
            // 后续处理 虚拟节点
            render(vnode);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
