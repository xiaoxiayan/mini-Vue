import { hasChange, isObject } from "../shared/index"
import { trackEffect, triggerEffects, isTracking } from "./effect"
import { reactive } from "./reactive"

class RefImpl {
  // ref 只有一个 value
  private _value :any
  public dep
  private _rawValue: any
  public __v_isRef = true
  constructor(value) {
    //
      this._rawValue = value
      this._value = convert(value)
      // value --> reactive
      // 1. 看看value 是不是对象，是的话要用reactive 包裹
      this.dep = new Set()
  }

  get value() {
    // 需要收集依赖
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    // 触发依赖 trigget , 一定要先修改，再触发
    // 判断是否重复
    if(hasChange(this._rawValue, newValue )){
      this._rawValue = newValue
      this._value = convert(newValue)
      triggerEffects(this.dep)
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

export function ref(value) {
  return  new RefImpl(value)
}

function trackRefValue(ref) {
  if(isTracking()){
    trackEffect(ref.dep)
  }
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
  // get -> 判断是不是 ref ，然后返回 value
  // get -> 不是 ref . return ref
  //  Proxy 方法拦截 target 对象的属性赋值行为。它采用 Reflect.set 方法将值赋值给对象的属性，确保完成原有的行为，然后再部署额外的功能。
  return new Proxy(objectWithRefs, {
    get(target, key){
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value){
      if(isRef(target[key]) && !isRef(value)) {
        // 如果设置的对象是 ref型， 且 设置的值 不是 ref 需要替换 value
        return target[key].value = value
      } else {
        // 其他情况 都可以直接替换
        return Reflect.set(target, key, value)
      }
    }
  })
}