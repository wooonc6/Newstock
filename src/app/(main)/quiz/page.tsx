import QuizHomeClient from "./QuizHomeClient";

export default function QuizHomePage() {
  return <QuizHomeClient />;
}
'use client'

/**
 * src/app/(main)/quiz/[stock]/page.tsx
 *
 * 문서(김승민A_FE.md) 기준 구현:
 *  1) GET /api/learning/news?ticker=... 로 뉴스 목록 로드
 *  2) 뉴스 클릭 시 GET /api/learning/quiz/{newsId} 로 퀴즈 로드
 *  3) 1/3/6개월 후 주가 변화율 4지선다 문제를 순서대로 진행
 *  4) POST /api/quiz/submit 으로 채점 및 코인 지급
 *
 * 주의: 실제 API 응답 스키마, 디자인 토큰(색상/폰트)은 프로젝트 실제 코드와
 * reference/design_reference.html 을 확인해 맞춰주세요. 아래는 문서에 명시된
 * 계약(request/response 형태)을 기준으로 한 합리적 기본 구현입니다.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface NewsItem {
  id: string
  title: string
  date: string
  category: string
  difficulty: '쉬움' | '보통' | '어려움'
}

interface QuizChoice {
  label: string
  value: number
}

interface QuizQuestion {
  months: 1 | 3 | 6
  choices: QuizChoice[]
}

interface QuizData {
  news_id: string
  stock_ticker: string
  stock_name: string
  news_date: string
  news_title: string
  questions: QuizQuestion[]
}

interface SubmitAnswer {
  months: number
  selected_index: number
}

interface SubmitResult {
  coins_earned: number
  correct_count: number
  total_count: number
}

type ViewState = 'list' | 'quiz' | 'result'

export default function QuizPage() {
  const params = useParams<{ stock: string }>()
  const ticker = params.stock

  const [view, setView] = useState<ViewState>('list')

  // 뉴스 목록
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // 퀴즈
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<SubmitAnswer[]>([])

  // 채점
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  useEffect(() => {
    if (!ticker) return

    async function fetchNews() {
      setLoadingList(true)
      setListError(null)
      try {
        const res = await fetch(`/api/learning/news?ticker=${ticker}`)
        if (!res.ok) throw new Error('뉴스 목록을 불러오지 못했습니다.')
        const data = await res.json()
        setNewsList(Array.isArray(data) ? data : data.news ?? [])
      } catch (err) {
        setListError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoadingList(false)
      }
    }

    fetchNews()
  }, [ticker])

  async function handleSelectNews(newsId: string) {
    setLoadingQuiz(true)
    setQuizError(null)
    setQuestionIndex(0)
    setAnswers([])
    setResult(null)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/learning/quiz/${newsId}`)
      if (!res.ok) throw new Error('퀴즈를 불러오지 못했습니다.')
      const data: QuizData = await res.json()
      setQuiz(data)
      setView('quiz')
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoadingQuiz(false)
    }
  }

  function handleChoice(choiceIndex: number) {
    if (!quiz) return
    const question = quiz.questions[questionIndex]
    const nextAnswers = [...answers, { months: question.months, selected_index: choiceIndex }]
    setAnswers(nextAnswers)

    if (questionIndex + 1 < quiz.questions.length) {
      setQuestionIndex(questionIndex + 1)
    } else {
      submitQuiz(nextAnswers)
    }
  }

  async function submitQuiz(finalAnswers: SubmitAnswer[]) {
    if (!quiz) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news_id: quiz.news_id,
          stock_ticker: quiz.stock_ticker,
          answers: finalAnswers,
        }),
      })
      if (!res.ok) throw new Error('채점 처리에 실패했습니다.')
      const data: SubmitResult = await res.json()
      setResult(data)
      setView('result')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackToList() {
    setView('list')
    setQuiz(null)
    setQuestionIndex(0)
    setAnswers([])
    setResult(null)
  }

  const difficultyStyle: Record<NewsItem['difficulty'], string> = {
    쉬움: 'bg-emerald-100 text-emerald-700',
    보통: 'bg-amber-100 text-amber-700',
    어려움: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {view === 'list' && (
        <section>
          <h1 className="mb-4 text-xl font-bold text-slate-900">📰 뉴스 퀴즈</h1>

          {loadingList && (
            <p className="py-10 text-center text-sm text-slate-500">뉴스를 불러오는 중...</p>
          )}

          {listError && (
            <p className="py-10 text-center text-sm text-rose-600">{listError}</p>
          )}

          {!loadingList && !listError && newsList.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              아직 등록된 뉴스가 없어요.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {newsList.map((news) => (
              <li key={news.id}>
                <button
                  type="button"
                  onClick={() => handleSelectNews(news.id)}
                  disabled={loadingQuiz}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:opacity-50"
                >
                  <p className="line-clamp-2 font-medium text-slate-900">{news.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>{news.date}</span>
                    <span>·</span>
                    <span>{news.category}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 font-medium ${difficultyStyle[news.difficulty]}`}
                    >
                      {news.difficulty}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {quizError && (
            <p className="mt-4 text-center text-sm text-rose-600">{quizError}</p>
          )}
        </section>
      )}

      {view === 'quiz' && quiz && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span className="font-medium text-slate-700">{quiz.stock_name}</span>
            <span>{quiz.news_date}</span>
          </div>

          <p className="mb-4 font-semibold text-slate-900">&ldquo;{quiz.news_title}&rdquo;</p>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              이 뉴스가 나온 후{' '}
              <span className="font-bold text-slate-900">
                {quiz.questions[questionIndex].months}개월
              </span>{' '}
              뒤 주가는?
            </p>
            <span className="text-xs text-slate-400">
              {questionIndex + 1} / {quiz.questions.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quiz.questions[questionIndex].choices.map((choice, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChoice(idx)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                {choice.label}
              </button>
            ))}
          </div>

          {submitting && (
            <p className="mt-4 text-center text-xs text-slate-400">채점 중...</p>
          )}
          {submitError && (
            <p className="mt-4 text-center text-sm text-rose-600">{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleBackToList}
            className="mt-5 w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            ← 목록으로
          </button>
        </section>
      )}

      {view === 'result' && result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">퀴즈 완료!</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {result.correct_count} / {result.total_count} 정답
          </p>
          <p className="mt-3 text-lg font-semibold text-amber-600">
            + {result.coins_earned.toLocaleString()} 코인 획득
          </p>

          <button
            type="button"
            onClick={handleBackToList}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            다른 뉴스 풀어보기
          </button>
        </section>
      )}
    </div>
  )
}
