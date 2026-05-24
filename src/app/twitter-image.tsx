import { ImageResponse } from 'next/og'

export const alt = 'BetterEnglish - Improve Your Writing'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: 20,
              display: 'flex',
            }}
          >
            BetterEnglish
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#94a3b8',
              maxWidth: 800,
              display: 'flex',
              textAlign: 'center',
            }}
          >
            Transform your sentences into polished, professional English with AI
          </div>
          <div
            style={{
              marginTop: 40,
              padding: '12px 32px',
              backgroundColor: '#3b82f6',
              borderRadius: 8,
              fontSize: 24,
              color: '#ffffff',
              display: 'flex',
            }}
          >
            Try it free
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
