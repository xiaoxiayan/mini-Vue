'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
let activeEffect;
let shouldTrack;
// 使用类 构造 对应的依赖对象
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 会收集依赖
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        // 如果不是 stop 的状态，需要收集依赖
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        // 执行 stop ，把 deps 收集的 effect 全部删除， 就无法进行更新，在 运行runner 的时候 ，会执行返回的 _fn
        // cleanupEffect
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// Map 结构  [ { key:'', value: '' } ]  key 的设定可以多样性。相对 Obj 有更多的拓展，例如 key : funciton()
// targetMap 用于储存依赖
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // 依赖收集 函数 用于 后面响应数据，更新数据
    // 先取出 全部的 target，
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 初始化的时候需要创建一个大的对象 ，存储全部dep，用map
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        // 初始化
        // 不允许有重复的 key值对象，用了 set
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
    // const dep = new Set()
}
function trackEffect(dep) {
    // 防止重复收集依赖， 解决了第一节的 问题、- - - - -
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
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
// 依赖收集
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    // _effect.onStop = options.onStop
    // 重构
    // Object.assign(_effect, options)
    // 重构 更加 语义化 extend
    extend(_effect, options);
    _effect.run();
    // runner 相当于 effect 返回的 _fn ，然后再把 当前_effect 挂载在return 出去
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            track(traget, key);
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
    if (isTracking()) {
        trackEffect(ref.dep);
    }
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

const Fragment = Symbol('Fragment'); // slot 的类型
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        key: props && props.key ? props.key : null,
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
    const { createElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // 初始化
        // 调用 patch， 方便后续的递归
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        // 处理组件
        // 判断类型 类型主要分为两种，一种是 component 类型
        // render { component } vue文件都是组件类型
        const { type, shapeFlag } = n2;
        // Fragment -> 只渲染 chilren
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    //  另一种是 element 类型。 render { div } 直接调用render去渲染dom
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 分为初始化和 更新
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // canvs
        // new Element()
        // 挂在不同的平台，canvas ,dom
        const el = (vnode.el = createElement(vnode.type));
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
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
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        // 创建组件实例 app其实就是最大组件。
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    // 更新 effect
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // 使用 effect去包裹，在effect中传入函数
        effect(() => {
            // vnode -> patch
            // vnode -> element -> mountElement
            // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
            // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
            if (!instance.isMount) {
                // 初始化
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                initialVnode.el = subTree.el;
                instance.isMount = true;
            }
            else {
                // 对比两个树
                const { proxy } = instance;
                const prevSubTree = instance.subTree;
                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
                // if(subTree !== prevSubTree)
            }
        });
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 处理更新逻辑。props , element
        console.log('n1-old', n1);
        console.log('n2-new', n2);
        // 需要把 el 继承，方便下次更新的时候
        const el = (n2.el = n1.el);
        const oldProps = n1.props || {};
        const nextProps = n2.props;
        // 更新子集，更新props
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, nextProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        // 判断子集的内容，
        const { shapeFlag } = n2;
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        // 如果新的 shapeFlag 是 text
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 如果旧的是 array
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 1.把老的数组清空
                unmountChildren(n1.children);
                // 2.set -> text 加载
            }
            // 两个节点都是 text
            // 1.把原来的 text 置空，然后替换成新的text
            //  重构， 对于数组转 TEXT ，C1 和 C2 本来就不一样， 文本也可以直接对比
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 如果新的是数组
            //  text -> Array || Array -> Array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 旧的是text
                // 1.先把text = ''
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
                // 2.pathArray
            }
            else {
                // 旧的是数组
                // 1.先romve ，在 mount . 简单是实现，性能损耗很大
                // unmountChildren(n1.children)
                //  diff算法
                patchKeyChildren(c1, c2, container, parentComponent, anchor);
            }
            // mountChildren(c2, container, n2)
        }
    }
    function patchKeyChildren(c1, c2, container, parentComponent, anchor) {
        // diff
        // 左侧对比, i++ 循环
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVnodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVnodeType(n1, n2)) {
                // 如果相同，我们就递归去寻找d对比
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            console.log(i);
            i++;
        }
        console.log(i);
        // 右侧对比 定位 e1 ,e2
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老得长 ， 添加   在左侧， 在右侧
        if (i > e1) {
            if (i <= e2) {
                // 添加， 标记锚点。因为在右侧的时候，一样会进来。  i=0. e1 = -1 , e2 = 0
                // 如果 i+1 大于 c2 的长度，说明是 在左侧，添加到末尾, 否则添加到元素节点前面
                // 当在 相同节点右侧， 左边的节点多的时候 会出bug ，e1只锁定在了 -1
                //  获取到真正的相同元素
                let nextPos = i + 1;
                while (c2[nextPos] && !c2[nextPos].el && i + 1 < l2) {
                    nextPos++;
                }
                const anchor = i + 1 < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 老得比新的长， 删除   在左侧， 在右侧
    }
    function unmountChildren(children) {
        // 循环调用runtime-dom 中的 remove
        for (let index = 0; index < children.length; index++) {
            const element = children[index].el;
            hostRemove(element);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 遍历属性，新的属性遍历，对比老的, 调用传值修改。
            for (const key in newProps) {
                const prevProps = oldProps[key];
                const nextProps = newProps[key];
                if (prevProps !== nextProps) {
                    hostPatchProp(el, key, prevProps, nextProps);
                }
            }
            // 如果 oldProps 是一个空对象，不要去检测
            // 如果 props 改了。需要遍历old 的props ,如果新的没有，需要删除
            if (oldProps !== {}) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // implement
        console.log('processFragment');
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
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
function patchProp(el, key, prevVal, nextVal) {
    // 添加事件，修改属性
    // rule: on 开头 ，第三位 为大写
    // 具体的 click ---> 通用 9 -- -------------
    // on + Event
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 是事件，添加
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // 如果 nextVal 变成 underfined 需要把属性删除
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.append(el)
    // 使用锚点添加到对应的位置
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
// 输出一个 createApp， 维持原有的调用
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
