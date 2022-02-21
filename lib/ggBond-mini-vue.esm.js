const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasChange = (val, newValue) => {
    return !Object.is(val, newValue);
};
//  call 的神奇用法
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

// 依赖收集
let shouldTrack;
// Map 结构  [ { key:'', value: '' } ]  key 的设定可以多样性。相对 Obj 有更多的拓展，例如 key : funciton()
// targetMap 用于储存依赖
const targetMap = new Map();
function isTracking() {
    return shouldTrack ;
}
// update 触发。
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 缓存机制，初始化的时候就创建了。后面一直使用
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(traget, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(traget, key);
        if (shallow) {
            return res;
        }
        // 看看 res 是不是 object , 嵌套 验证,
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(traget, key, value) {
        const res = Reflect.set(traget, key, value);
        // 触发设置
        trigger(traget, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(traget, key, value) {
        console.warn(`${key} set失败，${traget} 是 readonly`);
        return true;
    }
};
const shallowReadonlyHandler = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandler);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must is Object`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        //
        this._rawValue = value;
        this._value = convert(value);
        // value --> reactive
        // 1. 看看value 是不是对象，是的话要用reactive 包裹
        this.dep = new Set();
    }
    get value() {
        // 需要收集依赖 track
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 触发依赖 trigget , 一定要先修改，再触发
        // 判断是否重复
        if (hasChange(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function trackRefValue(ref) {
    console.log(ref, '---', isTracking());
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    // get -> 判断是不是 ref ，然后返回 value
    // get -> 不是 ref . return ref
    //  Proxy 方法拦截 target 对象的属性赋值行为。它采用 Reflect.set 方法将值赋值给对象的属性，确保完成原有的行为，然后再部署额外的功能。
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                // 如果设置的对象是 ref型， 且 设置的值 不是 ref 需要替换 value
                return target[key].value = value;
            }
            else {
                // 其他情况 都可以直接替换
                return Reflect.set(target, key, value);
            }
        }
    });
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        shapeFlag: getShapFlag(type),
        children
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 判断是否为 slot类型， 组件 + children Object
    if (vnode.shapeFlag && 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag !== 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    //  vnode
    if (slot) {
        // 作用域插槽，传入 function ，带参数
        if (typeof slot === 'function') {
            // 虚拟节点的 children 是不可有 array
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function emit(instance, event, ...args) {
    // insatnce.props --> event
    const { props } = instance;
    // TPP
    // 先去写一个特定的行为---》 重构成通用的行为
    // add -> Add
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    //  attrs---------+++
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    // $slot
    $slots: (i) => i.slots
};
const componentPublicInstance = {
    get({ _: instance }, key) {
        // 从 setupState 中获取值
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        //  key -> $el
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // 判断是不是 slot 类型才进行初始化
    const { vnode } = instance;
    if (vnode.shapeFlag && 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
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
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // TODO
    initSlots(instance, instance.vnode.children);
    // 初始化一个有状态的 component
    setupStatefulComponet(instance);
}
function setupStatefulComponet(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // 设置一个代理对象，绑定到render上 ，让render的时候可以获取到变量,所有在 render中的 get操作都会被代理。
    // 从而通过代理 拿到值
    instance.proxy = new Proxy({ _: instance }, componentPublicInstance);
    // v3 ，判断是否有核心的数据函数 setup
    if (setup) {
        // 在 setup 的时候 给 currentInstance 赋值
        setCurrentInstance(instance);
        // 可能是 fun, object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // fn ,obj
    if (typeof setupResult === 'object') {
        //   包裹一下，使得ref 在使用的时候， 直接获取到 proxyRefs
        instance.setupState = proxyRefs(setupResult);
    }
    // TODO function
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
//  定义一个全局变量  currentInstance  去获取当前的 实例对象 type。
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
// 使用函数包裹，可以方便后续 debugger
function setCurrentInstance(instance) {
    currentInstance = instance;
}

// 输出 provide 和 inject
function provide(key, value) {
    //  需要挂载 到 instance 上， 通过api  getcurrentInstance
    const currentInstance = getCurrentInstance();
    console.log('provide===', currentInstance);
    //  把设定的provide 绑定到 实例对象上
    // 因为provide  是在 setup 上 使用的，所以需要判断一下是否存在再去存，
    // 初始化的时候是没有的实例
    if (currentInstance) {
        let { provides } = currentInstance;
        // 获取是获取 父级的provides ， 如果没有，就需要继续向上寻找。 原型链原理
        const parentProvides = currentInstance.parent.provides;
        // 初始化的时候才需要去 创造远行链，指向父级
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultkey) {
    // 取需要取父级的 provides
    // 支持传入默认值
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultkey) {
            if (typeof defaultkey === 'function') {
                return defaultkey();
            }
            return defaultkey;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // vue3 把所有东西转换成 vnode
                // component -> vnode
                // 所有操作 基于 vnode 处理
                const vnode = createVNode(rootComponent);
                // 后续处理 虚拟节点
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    const { createElement, pathProp, insert } = options;
    function render(vnode, container) {
        // 调用 patch， 方便后续的递归
        patch(vnode, container, null);
    }
    function patch(vnode, container, parentComponent) {
        // 处理组件
        // 判断类型 类型主要分为两种，一种是 component 类型
        // render { component } vue文件都是组件类型
        const { type, shapeFlag } = vnode;
        // Fragment -> 只渲染 chilren
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
                    // TODO processElement
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function processElement(vnode, container, parentComponent) {
        // 分为初始化和 更新
        mountElement(vnode, container, parentComponent);
    }
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        // canvs
        // new Element()
        // 挂在不同的平台，canvas ,dom
        const el = (vnode.el = createElement(vnode.type));
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        const { props } = vnode;
        for (const key in props) {
            let val = props[key];
            // TODO 如果 class是个数组
            if (Array.isArray(val)) {
                let className = '';
                val.map(name => {
                    className += name + ' ';
                });
                val = className;
            }
            pathProp(el, key, val);
        }
        insert(el, container);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    // 更新 effect
    function setupRenderEffect(instance, initialVnode, container) {
        // 使用 effect去包裹，在effect中传入函数
        // effect(() => {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // vnode -> patch
        // vnode -> element -> mountElement
        // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
        // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
        patch(subTree, container, instance);
        initialVnode.el = subTree.el;
        // })
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(v, container, parentComponent);
        });
    }
    function processFragment(vnode, container, parentComponent) {
        // implement
        mountChildren(vnode, container, parentComponent);
    }
    function processText(vnode, container) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 返回一个对象，把 render funciton 传过去
    //
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function pathProp(el, key, val) {
    // 添加事件，
    // rule: on 开头 ，第三位 为大写
    // 具体的 click ---> 通用 9 -- -------------
    // on + Event
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 是事件，添加
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    pathProp,
    insert
});
// 输出一个 createApp， 维持原有的调用
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
