export function emit (instance, event) {
  console.log('componentEmit' ,event)
  // insatnce.props --> event
  const { props } = instance

// TPP
// 先去写一个特定的行为---》 重构成通用的行为
const handler = props["onAdd"]
handler && handler()
}