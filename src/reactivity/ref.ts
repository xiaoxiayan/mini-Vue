import { hasChange, isObject } from "../shared"
import { trackEffect, triggerEffects, isTracking } from "./effect"
import { reactive } from "./reactive"

class RefImpl {
  // ref 只有一个 value
  private _value :any
  public dep
  private _rawValue: any
  constructor(value) {
    //
      this._rawValue = value
      this._value = convert(value)
      // value --> reactive
      // 1. 看看value 是不是对象，是的话要用reactive 包裹
      this.dep = new Set()
  }

  get value() {
    // 需要收集依赖 track
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
  return   new RefImpl(value)
}

function trackRefValue(ref) {
  if(isTracking()){
    trackEffect(ref.dep)
  }
}
