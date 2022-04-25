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

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (value) => typeof value === 'string';
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
        console.log('ReactiveEffect==', result);
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
    console.log('触发了effect');
    // fn
    // 在dom初始化的时候收集依赖 instance.update = effect ,
    // 返回一个 runner -> 也就是返回一个
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
    $slots: (i) => i.slots,
    $props: (i) => i.props
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
        component: null,
        update: null,
        next: null,
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
    console.log('初始化具体组件');
    // TODO
    initProps(instance, instance.vnode.props);
    // TODO
    initSlots(instance, instance.vnode.children);
    // 初始化一个有状态的 component
    setupStatefulComponet(instance);
}
function setupStatefulComponet(instance) {
    console.log('初始化一个有状态的 component');
    const Component = instance.type;
    const { setup } = Component;
    // 设置一个代理对象，绑定到render上 ，让render的时候可以获取到变量,所有在 render中的 get操作都会被代理。
    // 从而通过代理 拿到值
    instance.proxy = new Proxy({ _: instance }, componentPublicInstance);
    // v3 ，判断是否有核心的数据函数 setupupdateComponent
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
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
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
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

const queue = [];
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    // 把 job添加到队列。如有有了就不添加， 没有才添加
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    console.log('queueFlush');
    // 创建一个微任务，promise ，
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        console.log('render---渲染', container);
        // 初始化
        // 调用 patch， 方便后续的递归
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        console.log('patch---');
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
        if (!n1) {
            // 初始化 component
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            // 更新 componet
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 更新， 调用 update
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            n2.vnode = n2;
        }
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
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    // 更新 effect
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // 使用 effect去包裹，在effect中传入函数
        instance.update = effect(() => {
            // vnode -> patch
            // vnode -> element -> mountElement
            // 我们在每次更新的时候都回去创建一个新的，所以需要进新对比
            // 可以定义一个 isMount ,判断isMount ,如果是就初始化，赋值， 否则就对比
            if (!instance.isMount) {
                // 初始化
                const { proxy } = instance;
                // call 第一个参数是，this，  第二个参数就可以当做 传入 render的内容， 相当于 _ctx
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                initialVnode.el = subTree.el;
                instance.isMount = true;
            }
            else {
                // 对比两个树
                const { next, vnode } = instance;
                if (next) {
                    // 更新el
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const prevSubTree = instance.subTree;
                const subTree = instance.render.call(proxy, proxy);
                instance.subTree = subTree;
                // 处理组件更新
                // 需要一个更新以后的 vnode
                patch(prevSubTree, subTree, container, instance, anchor);
                // if(subTree !== prevSubTree)
            }
        }, {
            scheduler() {
                console.log('upadte--scheduler');
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(insatnce, nextVnode) {
        // 需要更新实例对象上的 props
        insatnce.vnode = nextVnode;
        insatnce.next = null;
        insatnce.props = nextVnode.props;
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 处理更新逻辑。props , element
        // console.log('n1-old', n1)
        // console.log('n2-new', n2)
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
                // patchKeyChildren_Review(c1, c2, container, parentComponent, anchor)
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
        // 如果不同点再右侧，
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
            i++;
        }
        // 右侧对比 定位 e1 ,e2，
        // 如果不同点再左侧，通过 e1, e2定位 到不同
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
                //  获取到真正的相同元素 判断又问题
                let nextPos = e2 + 1;
                // while( c2[nextPos] && !c2[nextPos].el  && i + 1  < l2) {
                //   nextPos ++
                // }
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老得比新的长， 删除   在左侧， 在右侧
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比。
            // 优化。是否需要 moved
            let moved = false;
            let maxNewIndeSoFar = 0;
            // 定义 变量， map, s1 ,s2. (i的位置)
            let s1 = i;
            let s2 = i;
            let patched;
            const toBePatched = e2 - s2 + 1;
            // 建立映射表，存储新的变更区间中的 key 和对应的位置，然后在老的节点循环中，
            // 查找是否存在, 得到对应 newIndex ，
            const keyToNewIndexMap = new Map();
            //  new array  一个数组，来映新的节点 在旧的 节点中对应的 index
            // 建立映射，得到中间 需要改变的 数组的 具体信息， 如
            // ab (c d e ) f g ->  ab (e c d ) f g
            // 得到 e c d  ,[  4 , 2, 3] 的 key -> index
            // 然后根据最长递增子序列，去比较，如果是在 最长递增子序列返回的数组内，就不去操作
            // 否则 就去 insert , add
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化给个 0， 如果 没有赋值，说明 在旧的节点中不存在，需要去新增。
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 循环 s1节点，查找map是否存在
            let newIndex;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // 优化点，如果已经比对完了。那么旧节点中多出来的，就是多余的，可以直接去删除
                    hostRemove(prevChild.el);
                    continue;
                }
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 普通遍历
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 不存在删除
                    hostRemove(prevChild.el);
                }
                else {
                    // 如果存在。递归去比对
                    // 映射表赋值  从 0 开始， 但是中间对比的newIndex 需要减去 s2。 i+1 是为了避免 当前这个处理的节点是第一个
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    if (newIndex >= maxNewIndeSoFar) {
                        maxNewIndeSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            debugger;
            // 前面的步骤已经删除完毕，剩下是新增 和 乱序的内容
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []; // [1, 2]
            // 对比去操作。倒叙对比，因为 inset 需要一个稳定的元素，所以从最后一个开始
            // 需要2个子针， 一个标记 [e,c,d] 中的位置，一个标记 j 最长子序列的标记
            // a b  [c, d ,e ] f g-> a , b,  [e, d , c] f g
            //  2 3 4
            // [ 1, 2 ]
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // add or insert
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
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
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
    parent.append(child);
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

var NodeTypes;
(function (NodeTypes) {
    NodeTypes[NodeTypes["INTERPOLATION"] = 0] = "INTERPOLATION";
    NodeTypes[NodeTypes["SIMPLE_EXPRESSION"] = 1] = "SIMPLE_EXPRESSION";
    NodeTypes[NodeTypes["ELEMENT"] = 2] = "ELEMENT";
    NodeTypes[NodeTypes["TEXT"] = 3] = "TEXT";
    NodeTypes[NodeTypes["ROOT"] = 4] = "ROOT";
    NodeTypes[NodeTypes["COMPUND_EXPRESSION"] = 5] = "COMPUND_EXPRESSION";
})(NodeTypes || (NodeTypes = {}));
function createVnodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children
    };
}

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFuncitonPreamble(ast, context);
    let functionName = 'render';
    let args = ['_ctx', '_cache'];
    const signature = args.join(',');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    // 通过 ast 树去获取的 return 内容
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code
    };
}
function genFuncitonPreamble(ast, context) {
    const { push } = context;
    const vueBinging = 'vue';
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const {${ast.helpers.map(aliasHelper).join(', ')}} = ${vueBinging}`);
    }
    push('\n');
    push('return ');
}
function genNode(node, context) {
    // 区分node类型，去return 不同的内容
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        case NodeTypes.INTERPOLATION:
            genInterPolation(node, context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            getExperssion(node, context);
            break;
        case NodeTypes.ELEMENT:
            genElement(node, context);
            break;
        case NodeTypes.COMPUND_EXPRESSION:
            genCompoundExpression(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function createCodegenContext() {
    const context = {
        code: '',
        push(sourse) {
            context.code += sourse;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genInterPolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function getExperssion(node, context) {
    // 专门处理表达式的类型
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // 把假的值都替换成 null, 但是 genNode 只支持一个，改成支持 数组
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context)
    push(')');
    // 创建新的节点类型， 判断是不是连续的 text, 插值
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // 如果是 文字节点
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
// 抽离对象
function createParseContext(content) {
    return {
        sourse: content
    };
}
function createRoot(children) {
    return {
        children,
        type: NodeTypes.ROOT
    };
}
// ancestors 祖先，收集 标签
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.sourse;
        // 需要循环取调用解析，直到没有值。
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseInterpolation(context) {
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    //  {{message}}
    const closeIndex = context.sourse.indexOf(closeDelimiter, openDelimiter.length);
    // 向前推进
    advanceBy(context, openDelimiter.length);
    // 计算出中间的长度，然后截取
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawcontent = parseTextData(context, rawContentLength);
    const content = rawcontent.trim();
    // 然后继续推进
    console.log(context.sourse, rawContentLength + closeDelimiter.length, '长度');
    advanceBy(context, closeDelimiter.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content
        }
    };
}
function advanceBy(context, length) {
    context.sourse = context.sourse.slice(length);
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */);
    // 收集出现过的标签
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    // 弹出推进过的 标签
    ancestors.pop();
    // 需要判断一下， ancestors 和 当前的 标签相同才 推进。
    if (startsWithEndTagOpen(context.sourse, element.tag)) {
        parseTag(context, 1 /* End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(sourse, tag) {
    return sourse.startsWith('</') && sourse.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseTag(context, type) {
    // 1.解析。tag 。正则
    const match = /^<\/?([a-z]*)/i.exec(context.sourse);
    const tag = match[1];
    // 2.推进删除代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* End */)
        return;
    return {
        type: NodeTypes.ELEMENT,
        tag: tag
    };
}
function parseText(context) {
    // 推进， 删除
    let endIndex = context.sourse.length;
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.sourse.indexOf(endTokens[i]);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content
    };
}
function parseTextData(context, length) {
    const content = context.sourse.slice(0, length);
    advanceBy(context, length);
    return content;
}
function isEnd(context, ancestors) {
    const s = context.sourse;
    // 2. 遇到结束标签的时候 , 循环收集过的 ancestors， 如果有相同的就跳出循环，防止死循环
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag))
                return true;
        }
    }
    // 1. sourse 有值的时候
    return !s;
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历- 深度优先搜索
    traverseNode(root, context);
    // 创建 codegen 能直接使用的 codegenNode
    createCodegenNode(root);
    // 在根结点的时候 挂在一个 helper
    root.helpers = [...context.helpers.keys()];
}
function traverseNode(node, context) {
    // 取出插入的 方法， 调用。
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    // 如果节点是 interpolation 插入节点，我们需要挂一个 helpers 的一个相关函数给 codegen，
    // 给 context去设置一个  helpers
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChilren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChilren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        children[i];
        traverseNode(children[i], context);
    }
}
function createTransformContext(root, options) {
    // 生成一个对象，包含插入方法。
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function createCodegenNode(root) {
    // 如果类型是 element 的， 我们直接使用 element上面的 codegenNode
    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}

function transformElement(node, context) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            //  不是很合理的地方
            let vnodeChildren = children[0];
            node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = proessExpression(node.content);
    }
}
function proessExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}

function transformText(node) {
    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    // 如果连续的节点是 text， interpolation
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: NodeTypes.COMPUND_EXPRESSION,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            // 添加以后删除，然后i 会变， 所以 j要 --
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    // 把ast 树 梳理成 render函数字符串
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
