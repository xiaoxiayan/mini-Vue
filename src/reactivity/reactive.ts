import { isObject } from "../shared/index"
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandler } from "./baseHandlers"

export const enum ReactiveFlags {
  IS_REACTIVE= "__v_isReactive",
  IS_READONLY= "__v_isReadonly"
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers)
}
export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY]
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandler)
}

export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isProxy(value) {
  return isReadonly(value) || isReactive(value)
}


function createReactiveObject(target: any, baseHandlers) {
  if(!isObject(target)) {
    console.warn(`target ${target} must is Object`)
    return target
  }
  console.log('响应式对象创建')
  return new Proxy(target, baseHandlers)
}