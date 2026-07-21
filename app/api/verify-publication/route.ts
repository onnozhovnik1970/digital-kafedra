import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { title, journal, type, scopus, wos, foreign_language, ukrainian_professional } = await request.json()
    

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: 'Ти асистент завідувача кафедри іноземних мов ДТЕУ. ' +
'Проаналізуй ТІЛЬКИ тематичну відповідність публікації профілю кафедри. ' +
'Профіль: іноземні мови, ESP, ділова комунікація, дипломатичний дискурс, методика викладання. ' +
'Назва публікації: ' + title + '. ' +
'Напиши 1-2 речення: чи відповідає тематика профілю кафедри і чому. ' +
'НЕ згадуй журнал, видавництво, бали, Scopus, WoS, фаховість. ТІЛЬКИ тематика. ' +
'Відповідай ТІЛЬКИ JSON: {"verified": true, "note": "коментар про тематику"}'
      }]
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('No text')

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ verified: false, note: 'Помилка верифікації.' })
  }
}