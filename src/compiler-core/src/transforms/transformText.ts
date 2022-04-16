import { NodeTypes } from "../ast";
import { isText } from "../utils";


export function transformText(node) {

  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node
      let currentContainer
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          // 如果连续的节点是 text， interpolation
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPUND_EXPRESSION,
                  children: [child]
                }
              }
              currentContainer.children.push(' + ')
              currentContainer.children.push(next)
              children.splice(j, 1)
              // 添加以后删除，然后i 会变， 所以 j要 --
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
