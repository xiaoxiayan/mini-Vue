'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; }
};
var componentPublicInstance = {
    get: function (_a, key) {
        var instance = _a._;
        // 从 setupState 中获取值
        var setupState = instance.setupState;
        if (key in setupState) {
            return setupState[key];
        }
        var publicGetter = publicPropertiesMap[key];
        //  key -> $el
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    //  记录一下 component 的状态信息
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        el: null,
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
    // 设置一个代理对象，绑定到render上 ，让render的时候可以获取到变量,所有在 render中的 get操作都会被代理。
    // 从而通过代理 拿到值
    instance.proxy = new Proxy({ _: instance }, componentPublicInstance);
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
    patch(vnode, container);
}
function patch(vnode, container) {
    // 处理组件
    // 判断类型 类型主要分为两种，一种是 component 类型
    // render { component } vue文件都是组件类型
    var shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 1 /* ELEMENT */) {
        //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
        // TODO processElement
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // 分为初始化和 更新
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountElement(vnode, container) {
    var el = (vnode.el = document.createElement(vnode.type));
    var children = vnode.children, shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    var props = vnode.props;
    var _loop_1 = function (key) {
        var val = props[key];
        // TODO 如果 class是个数组
        if (Array.isArray(val)) {
            var className_1 = '';
            val.map(function (name) {
                className_1 += name + ' ';
            });
            el.setAttribute(key, className_1);
        }
        else {
            el.setAttribute(key, val);
        }
    };
    for (var key in props) {
        _loop_1(key);
    }
    container.append(el);
}
function mountComponent(initialVnode, container) {
    var instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    var proxy = instance.proxy;
    var subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    initialVnode.el = subTree.el;
}
function mountChildren(vnode, container) {
    vnode.children.forEach(function (v) {
        patch(v, container);
    });
}

function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        shapeFlag: getShapFlag(type),
        children: children
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            // vue3 把所有东西转换成 vnode
            // component -> vnode
            // 所有操作 基于 vnode 处理
            var vnode = createVNode(rootComponent);
            // 后续处理 虚拟节点
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
