import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DeZestien.nl - Nederlands Voetbalnieuws, Transfers & Analyse'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background: '#0a1628',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, transparent 40%, transparent 60%, rgba(16, 185, 129, 0.06) 100%)',
          }}
        />

        {/* Top gradient line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, transparent, #16a34a, #10b981, transparent)',
          }}
        />

        {/* Glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(22, 163, 74, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* Logo section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            marginBottom: '36px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #16a34a, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 0 40px rgba(22, 163, 74, 0.4), 0 0 80px rgba(16, 185, 129, 0.15)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '54px',
                fontWeight: 900,
                fontStyle: 'italic',
                lineHeight: 1,
              }}
            >
              16
            </span>
          </div>

          {/* DEZESTIEN.NL text */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-3px',
                lineHeight: 1,
              }}
            >
              DE
            </span>
            <span
              style={{
                color: '#16a34a',
                fontSize: '64px',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-3px',
                lineHeight: 1,
                textShadow: '0 0 30px rgba(22, 163, 74, 0.5)',
              }}
            >
              ZESTIEN
            </span>
            <span
              style={{
                color: '#6b7280',
                fontSize: '22px',
                fontWeight: 400,
                marginLeft: '8px',
              }}
            >
              .NL
            </span>
          </div>
        </div>

        {/* Gradient divider */}
        <div
          style={{
            width: '180px',
            height: '3px',
            background: 'linear-gradient(90deg, #16a34a, #10b981)',
            borderRadius: '2px',
            marginBottom: '32px',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: '#e5e7eb',
              fontSize: '34px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Nederlands Voetbalnieuws, Transfers & Analyse
          </span>
          <span
            style={{
              color: '#9ca3af',
              fontSize: '22px',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            Eredivisie, Champions League, Oranje en meer.
            Scherpe analyse, geen ruis.
          </span>
        </div>

        {/* CTA button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #16a34a, #10b981)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              boxShadow: '0 0 30px rgba(22, 163, 74, 0.3)',
            }}
          >
            Lees het laatste nieuws
            <span style={{ fontSize: '24px' }}>→</span>
          </div>
          <span
            style={{
              color: '#6b7280',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            dezestien.nl
          </span>
        </div>

        {/* Bottom gradient line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background:
              'linear-gradient(90deg, transparent, #10b981, #16a34a, transparent)',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
