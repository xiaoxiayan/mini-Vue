import { camelize, toHandlerKey } from "../shared/index"

export function emit (instance, event, ...args) {
  // insatnce.props --> event
  const { props } = instance

// TPP
// 先去写一个特定的行为---》 重构成通用的行为
// add -> Add
// add-foo -> addFoo

const handlerName  = toHandlerKey(camelize(event))
const handler = props[handlerName]
handler && handler(...args)
}