import { track, trigger } from "./effect"
import { ReactiveFlags } from "./reactive"
// 缓存机制，初始化的时候就创建了。后面一直使用
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
function createGetter(isReadonly = false) {
  return function get(traget, key) {
    if(key === ReactiveFlags.IS_REACTIVE){
      return !isReadonly
    }else if(key === ReactiveFlags.IS_READONLY){
      return isReadonly
    }
    const res = Reflect.get(traget, key)
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