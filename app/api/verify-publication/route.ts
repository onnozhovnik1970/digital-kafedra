import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { doi } = await request.json()

    if (!doi) {
      return NextResponse.json({ 
        verified: false, 
        message: 'DOI не вказано' 
      })
    }

    // Очищаємо DOI від префіксу https://doi.org/
    const cleanDoi = doi
      .replace('https://doi.org/', '')
      .replace('http://doi.org/', '')
      .replace('doi:', '')
      .trim()

    // Запит до Crossref API
    const response = await fetch(
      `https://api.crossref.org/works/${cleanDoi}`,
      {
        headers: {
          'User-Agent': 'digital-kafedra/1.0 (mailto:o.n.nozhovnik@gmail.com)'
        }
      }
    )

    if (!response.ok) {
      return NextResponse.json({ 
        verified: false, 
        message: 'Публікацію не знайдено у базі Crossref. Перевірте DOI або завантажте підтверджуючий документ.' 
      })
    }

    const data = await response.json()
    const work = data.message

    return NextResponse.json({
      verified: true,
      message: 'Публікацію верифіковано через Crossref ✅',
      details: {
        title: work.title?.[0] || '',
        authors: work.author?.map((a: any) => `${a.given} ${a.family}`).join(', ') || '',
        journal: work['container-title']?.[0] || '',
        year: work.published?.['date-parts']?.[0]?.[0] || '',
        publisher: work.publisher || '',
        issn: work.ISSN?.[0] || '',
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ 
      verified: false, 
      message: 'Помилка верифікації. Спробуйте пізніше.' 
    })
  }
}