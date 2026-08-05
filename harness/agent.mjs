// The one-line CLI adapter. Swap this file to swap agent runtimes; nothing in
// verification/ knows which model or SDK is in use.
import Anthropic from '@anthropic-ai/sdk'

// Lazy so the .env loader in up.mjs has run before the key is read.
let _client
const client = () => (_client ??= new Anthropic())

export const DRIVER_MODEL = process.env.VF_DRIVER_MODEL || 'claude-opus-5'
export const JUDGE_MODEL = process.env.VF_JUDGE_MODEL || 'claude-opus-5'

function assertNotRefused(res) {
  if (res.stop_reason === 'refusal') {
    throw new Error(`model refused: ${res.stop_details?.category ?? 'unknown'}`)
  }
}

/**
 * Agentic loop over locally-executed tools. Returns the model's final text.
 * `execute(name, input)` must return a string (or throw — errors are fed back).
 */
export async function runToolLoop({ model, system, content, tools, execute, maxTurns = 40 }) {
  const messages = [{ role: 'user', content }]

  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await client().messages.create({
      model,
      max_tokens: 16000,
      system,
      tools,
      messages,
    })
    assertNotRefused(res)
    messages.push({ role: 'assistant', content: res.content })

    if (res.stop_reason !== 'tool_use') {
      return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    }

    const results = []
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue
      try {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: String(await execute(block.name, block.input)),
        })
      } catch (err) {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `error: ${err.message}`,
          is_error: true,
        })
      }
    }
    messages.push({ role: 'user', content: results })
  }
  // ponytail: turn cap is a runaway guard, not a feature. Raise it if a real
  // flow legitimately needs more than 40 browser actions.
  throw new Error(`tool loop exceeded ${maxTurns} turns`)
}

/** Single call constrained to a JSON schema. Returns the parsed object. */
export async function runStructured({ model, system, content, schema }) {
  const res = await client().messages.create({
    model,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema } },
  })
  assertNotRefused(res)
  const text = res.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('judge returned no text block')
  return JSON.parse(text)
}
