import { NodeTypes } from "./src/ast";
import { baseParse } from "./src/parse";

describe('parse', () => {
  describe('interpolation', () => {
    test('simple interpolation', () => {
      const ast  = baseParse("{{ message}}");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message'
        }
      })
    })
  })
})

describe('element', () => {
  it('simple element div', () => {
    const ast  = baseParse("<div></div>");
    expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        children: []
    })
  })
})

describe('text', () => {
  it('simple text', () => {
    const ast  = baseParse("some text");
    expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text'
    })
  })
})

test('hello, word', () => {
  // const ast = baseParse('<div>hi,{{message}}</div>')
  const ast = baseParse('<div><p>hihi</p>{{message}}</div>')
  expect(ast.children[0]).toStrictEqual({
    type: NodeTypes.ELEMENT,
    tag: 'div',
    children: [
      {
        type: NodeTypes.ELEMENT,
        tag: 'p',
        children: [{
          type: NodeTypes.TEXT,
          content: 'hihi'
        }]
      },
      {
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message'
        }
      }
    ]

  })
})