/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../types.js').Handle} Handle
 * @typedef {import('../types.js').Exit} Exit
 */

import {formatHeadingAsSetext} from '../util/format-heading-as-setext.js'
import {containerPhrasing} from '../util/container-phrasing.js'
import {track} from '../util/track.js'

/**
 * @type {Handle}
 * @param {Heading} node
 */
export function heading(node, _, context, safeOptions) {
  const rank = Math.max(Math.min(6, node.depth || 1), 1)
  const tracker = track(safeOptions)

  // @ts-ignore
  const id = 'id' in node && node.id

  if (formatHeadingAsSetext(node, context)) {
    const exit = context.enter('headingSetext')
    const subexit = context.enter('phrasing')
    const value = containerPhrasing(node, context, {
      ...tracker.current(),
      before: '\n',
      after: '\n'
    })
    subexit()
    exit()

    return (
      value +
      '\n' +
      (rank === 1 ? '=' : '-').repeat(
        // The whole size…
        value.length -
          // Minus the position of the character after the last EOL (or
          // 0 if there is none)…
          (Math.max(value.lastIndexOf('\r'), value.lastIndexOf('\n')) + 1)
      )
    )
  }

  const sequence = '#'.repeat(rank)
  const exit = context.enter('headingAtx')
  const subexit = context.enter('phrasing')

  // Note: for proper tracking, we should reset the output positions when there
  // is no content returned, because then the space is not output.
  // Practically, in that case, there is no content, so it doesn’t matter that
  // we’ve tracked one too many characters.
  tracker.move(sequence + ' ')

  let value = containerPhrasing(node, context, {
    before: '# ',
    after: '\n',
    ...tracker.current()
  })

  if (/^[\t ]/.test(value)) {
    // To do: what effect has the character reference on tracking?
    value =
      '&#x' +
      value.charCodeAt(0).toString(16).toUpperCase() +
      ';' +
      value.slice(1)
  }

  // add heading ID for github markdown, part 1
  /*
  if (id) {
    value = `[${value}](#${id})<a id="${id}"></a>`
  }
  */

  value = value ? sequence + ' ' + value : sequence

  if (context.options.closeAtx) {
    value += ' ' + sequence
  }

  // add heading ID for github markdown, part 2
  //if (id) {
  //  value = `<a id="${id}"></a>\n\n${value}`
  //}

  // add heading ID for markdown extension
  // this does not work on github
  // https://www.markdownguide.org/extended-syntax/#heading-ids
  if (id) {
    value += ` {#${id}}`
  }

  subexit()
  exit()

  return value
}
