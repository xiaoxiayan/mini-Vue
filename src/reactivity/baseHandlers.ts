import { extend, isObject } from "../shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive"
// 缓存机制，初始化的时候就创建了。后面一直使用
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(traget, key) {
    if(key === ReactiveFlags.IS_REACTIVE){
      return !isReadonly
    }else if(key === ReactiveFlags.IS_READONLY){
      return isReadonly
    }
    const res = Reflect.get(traget, key)

    if(shallow){
      return res
    }
    // 看看 res 是不是 object , 嵌套 验证,
    if(isObject(res)){
      return isReadonly? readonly(res) : reactive(res)
    }
    if(!isReadonly){
      track(traget, key)
    }
    return res
  }
}

function createSetter() {
  return function set(traget, key, value) {
    const res = Reflect.set(traget, key, value)
    trigger(traget, key)
    return res
  }
}

export const mutableHandlers = {
  get,
  set
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(traget, key, value) {
      console.warn(`${key} set失败，${traget} 是 readonly`)
      return true
    }
}

export const shallowReadonlyHandler = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
})