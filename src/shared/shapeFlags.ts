// 使用 位运算符 提升性能
//  |  修改  两者都为  0  -> 0
//  &  查找  两者都为  1  -> 1
export const enum ShapeFlags {
  ELEMENT = 1,  // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
  SLOT_CHILDREN = 1 << 4, // 10000 
}