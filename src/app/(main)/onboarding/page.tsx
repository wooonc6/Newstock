'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'

const STEPS = [
  {
    icon: '📰',
    title: '뉴스 읽기',
    desc: '매일 업데이트되는 경제 뉴스를 읽으며 시장 흐름을 파악해요.',
    color: 'rgba(59,130,246,.12)',
    borderColor: 'rgba(59,130,246,.2)',
    textColor: '#60a5fa',
  },
  {
    icon: '❓',
    title: '퀴즈 풀기',
    desc: '뉴스를 얼마나 이해했는지 퀴즈로 확인하고 코인을 획득해요.',
    color: 'rgba(0,229,176,.08)',
    borderColor: 'rgba(0,229,176,.2)',
    textColor: 'var(--accent)',
  },
  {
    icon: '📈',
    title: '투자하기',
    desc: '퀴즈를 통과한 종목에 모의 투자하며 실전 감각을 키워요.',
    color: 'rgba(168,85,247,.1)',
    borderColor: 'rgba(168,85,247,.2)',
    textColor: '#c084fc',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)   // 0 = 소개, 1~3 = 각 단계, 4 = 완료
  const isIntro = step === 0
  const isDone = step === STEPS.length + 1
  const currentStep = STEPS[step - 1]

  function next() {
    if (step < STEPS.length + 1) setStep(s => s + 1)
  }

  function finish() {
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 18px',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px 32px',
          animation: 'fadeUp 0.4s ease',
        }}
      >
        {/* 로고 */}
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: '4px',
          }}
        >
          Newstock
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '32px',
          }}
        >
          뉴스로 배우는 모의 투자
        </div>

        {/* 진행 도트 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: '3px',
                flex: 1,
                borderRadius: '2px',
                background: i < step ? 'var(--accent)' : 'var(--surface2)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* 소개 화면 */}
        {isIntro && (
          <div style={{ animation: 'fadeUp 0.35s ease' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👋</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.4 }}>
              오신 것을 환영합니다!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '28px' }}>
              Newstock은 경제 뉴스를 읽고, 퀴즈를 풀고, 모의 투자까지 할 수 있는 학습 플랫폼이에요.
              단계별 안내로 어떻게 사용하는지 알아볼게요.
            </div>
            <Button style={{ width: '100%' }} onClick={next}>
              시작하기 →
            </Button>
          </div>
        )}

        {/* 단계별 화면 */}
        {!isIntro && !isDone && currentStep && (
          <div style={{ animation: 'fadeUp 0.35s ease' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                fontSize: '28px',
                background: currentStep.color,
                border: `1px solid ${currentStep.borderColor}`,
                marginBottom: '20px',
              }}
            >
              {currentStep.icon}
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: currentStep.textColor,
                marginBottom: '8px',
              }}
            >
              STEP {step}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              {currentStep.title}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '32px' }}>
              {currentStep.desc}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(0, s - 1))}>
                ← 이전
              </Button>
              <Button style={{ flex: 1 }} onClick={next}>
                {step === STEPS.length ? '완료하기' : '다음 →'}
              </Button>
            </div>
          </div>
        )}

        {/* 완료 화면 */}
        {isDone && (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.35s ease' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              준비 완료!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '28px' }}>
              이제 뉴스를 읽고 퀴즈를 풀면서 모의 투자를 시작해 보세요.
            </div>
            <Button style={{ width: '100%' }} onClick={finish}>
              대시보드로 이동 →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
