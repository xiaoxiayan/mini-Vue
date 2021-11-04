class ReactiveEffect 
{
    private _fn: any

    constructor(fn){
        this._fn = fn
    }
    run() {
        this._fn()
    }
}
const targetMap = new Map()
export function track (target, key) {
    // target -> key -> dep
    let depsMap = targetMap.get(targetMap)
    if(!depsMap){
        depsMap = new Map() 
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)
    if(!dep) {
        dep = new Set()
        depsMap.set(key)
    }
    dep.add(activeEffect)
    // const dep = new Set()
}
let activeEffect;
export function effect(fn) {
    // fn
    const _effect = new ReactiveEffect(fn)

    _effect.run()
}