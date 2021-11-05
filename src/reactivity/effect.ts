// 依赖收集
// 创建一个 effect ->

// 使用类 构造 对应的依赖对象
class ReactiveEffect
{
    private _fn: any

    constructor(fn){
        this._fn = fn
    }
    run() {
        activeEffect = this
        this._fn()
    }
}
// Map 结构  [ { key:'', value: '' } ]  key 的设定可以多样性。相对 Obj 有更多的拓展，例如 key : funciton()
// targetMap 用于储存依赖
const targetMap = new Map()
export function track (target, key) {
    // 依赖收集 && 触发依赖 函数 用于 后面响应数据，更新数据
    // 先取出 全部的 target，
    // target -> key -> dep
    let depsMap = targetMap.get(target)
    if(!depsMap){
        // 初始化的时候需要创建一个大的对象 ，存储全部dep，用map
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(!dep) {
        // 初始化
        // 不允许有重复的 key值对象，用了 set
        dep = new Set()
        depsMap.set(key, dep)
    }
    dep.add(activeEffect)
    // const dep = new Set()
}
// update 触发。
export function trigger(target, key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for(const effect of dep) {
        effect.run()
    }
}

let activeEffect;
// 依赖收集
export function effect(fn) {
    // fn
    const _effect = new ReactiveEffect(fn)
    _effect.run()
}