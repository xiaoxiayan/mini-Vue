// 依赖收集
// 创建一个 effect ->
import { extend } from '../shared/index'
let activeEffect;
let shouldTrack;
// 使用类 构造 对应的依赖对象
export class ReactiveEffect
{
    private _fn: any
    deps = []
    active = true
    onStop?: () => void
    constructor(fn, public scheduler?){
        this._fn = fn
        this.scheduler = scheduler
    }
    run() {
        // 会收集依赖
        if(!this.active){
            return this._fn()
        }
        shouldTrack = true
        // 如果不是 stop 的状态，需要收集依赖
        activeEffect = this
        const result = this._fn()
        // reset
        shouldTrack = false
        return result
    }
    stop() {
        // 执行 stop ，把 deps 收集的 effect 全部删除， 就无法进行更新，在 运行runner 的时候 ，会执行返回的 _fn
        // cleanupEffect
        if(this.active){
            cleanupEffect(this)
            if(this.onStop) {
                this.onStop()
            }
            this.active = false
        }
      }
}
function cleanupEffect (effect) {
    effect.deps.forEach((dep:any) => {
        dep.delete(effect)
    });
    effect.deps.length = 0;

}
// Map 结构  [ { key:'', value: '' } ]  key 的设定可以多样性。相对 Obj 有更多的拓展，例如 key : funciton()
// targetMap 用于储存依赖
const targetMap = new Map()
export function track (target, key) {

    if(!isTracking()) return
    // 依赖收集 函数 用于 后面响应数据，更新数据
    // 先取出 全部的 target，
    // target -> key -> dep
    let depsMap = targetMap.get(target)
    if(!depsMap){
        // 初始化的时候需要创建一个大的对象 ，存储全部dep，用map
        depsMap = new Map()
        console.log('LLLxxP__设置依赖___', target, key, depsMap);
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(!dep) {
        // 初始化
        // 不允许有重复的 key值对象，用了 set
        dep = new Set()
        depsMap.set(key, dep)
    }
    trackEffect(dep)
    // const dep = new Set()
}

export function trackEffect(dep) {
    // 防止重复收集依赖， 解决了第一节的 问题、- - - - -
    if(dep.has(activeEffect)) return
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}


export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

// update 触发。
export function trigger (target, key){
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    triggerEffects(dep)
}

export function triggerEffects (dep) {
    for(const effect of dep) {
        if(effect.scheduler){
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}

// 依赖收集
export function effect (fn, options:any = {}) {
    console.log('触发了effect==')
    // fn
    // 在dom初始化的时候收集依赖 instance.update = effect ,
    // 返回一个 runner -> 也就是返回一个
    const _effect = new ReactiveEffect(fn, options.scheduler)
    // options
    // _effect.onStop = options.onStop
    // 重构
    // Object.assign(_effect, options)
    // 重构 更加 语义化 extend
    extend(_effect, options)
    _effect.run()
    // runner 相当于 effect 返回的 _fn ，然后再把 当前_effect 挂载在return 出去
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

export function stop (runner) {
    //  water~~~~water!!~~water!!!!~~~water~~~~~!!!!water~~~~~!!!!!
    runner.effect.stop()
}