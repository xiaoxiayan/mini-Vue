import { isObject } from "../shared"
import { trackEffect, triggerEffects, isTracking } from "./effect"
import { reactive } from "./reactive"


class RefImpl {
  private _value: any
  public dep
  private _rawValue: any

  constructor (value) {
    this._rawValue = value
    // 考虑到 传入的可能是一个对象, 需要判断一下是否是个对象
    // 1. 看看value 是不是对象， 如果是对象，需要用 reactive 包裹一下
    // 不过对象不设置成 reactive 响应式的话，在 set的时候就不会去触发 effect ， 包裹的值就无法改变了
    this._value = convert(value)
    // this._value = value

    // 初始化的时候 设定成 dep
    this.dep = new Set()
  }
  get value() {
    // 收集依赖
    if(isTracking()) {
      // 先检测一下是否存在 实例才能去收集，初始化的时候
      trackEffect(this.dep)
    }
    console.log('触发 get', this._value)
    return this._value
  }
  set value (newVal) {
    // 设置值为 value , 一定要设置值了。再去触发依赖
    if(isChange(this._rawValue, newVal)) {
      this._rawValue = newVal
      this._value =  convert(newVal)
     // 触发依赖，
      triggerEffects(this.dep)
    }

  }
}

function convert(val) {
  return isObject(val) ? reactive(val) : val
}

function isChange(val, newVal) {
  return  !Object.is(val, newVal)
}

export function ref (value) {
  return new RefImpl(value)
}