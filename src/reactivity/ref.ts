import { hasChange } from "../shared"
import { trackEffect, triggerEffects, isTracking } from "./effect"

class RefImpl {
  // ref 只有一个 value
  private _value :any
  public dep
  constructor(value) {
      this._value = value
      this.dep = new Set()
  }

  get value() {
    // 需要收集依赖 track
    if(isTracking()){
      trackEffect(this.dep)
    }
    return this._value
  }
  set value(newValue) {
    // 触发依赖 trigget , 一定要先修改，再触发
    // 判断是否重复
    if(hasChange(this._value,newValue )){
      this._value = newValue
      triggerEffects(this.dep)
    }
  }
}

export function ref(value) {
  return   new RefImpl(value)
}


