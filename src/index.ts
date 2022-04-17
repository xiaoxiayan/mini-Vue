export * from './runtime-dom';
import {registerRuntimeCompiler} from './runtime-dom'

import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function("vue", code)(runtimeDom)
  console.log('==render', render)
  return  render


}
registerRuntimeCompiler(compileToFunction)