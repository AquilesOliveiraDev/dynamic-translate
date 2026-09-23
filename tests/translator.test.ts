import { translateText, chunkArray, asyncPool } from '../src/core/translator'

describe('Translator Module', () => {
  test('returns original text if source and target are the same', async () => {
    const text = 'Olá mundo'
    const res = await translateText({
      text,
      from: 'pt-br',
      to: 'pt-BR',
      provider: 'google',
    })
    expect(res).toBe(text)
  })

  test('chunkArray correctly divides array into smaller chunks', () => {
    const items = [1, 2, 3, 4, 5, 6, 7]
    const chunks = chunkArray(items, 3)
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  test('asyncPool executes asynchronous tasks concurrently', async () => {
    const items = [1, 2, 3, 4, 5]
    const results = await asyncPool(2, items, async (num) => {
      return num * 2
    })
    expect(results).toEqual([2, 4, 6, 8, 10])
  })
})
