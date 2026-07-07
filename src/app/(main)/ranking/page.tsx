'use client'

/**
 * src/app/(main)/ranking/page.tsx
 *
 * 문서(김승민A_FE.md) 기준 구현:
 *  - Supabase `users` 테이블에서 코인 기준 상위 50명 조회
 *  - 1~3위 메달 표시
 *  - 로그인한 내 순위 강조 표시
 *
 * 주의: `@/lib/supabase/client` 경로와 `users` 테이블 컬럼명(id, nickname, coins)은
 * 문서에 나온 예시를 그대로 사용했습니다. 실제 스키마와 다르면 맞춰 수정해주세요.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RankedUser {
  id: string
  nickname: string
  coins: number
}

const MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export default function RankingPage() {
  const [users, setUsers] = useState<RankedUser[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      try {
        const { data: authData } = await supabase.auth.getUser()
        setCurrentUserId(authData.user?.id ?? null)

        const { data, error: queryError } = await supabase
          .from('users')
          .select('id, nickname, coins')
          .order('coins', { ascending: false })
          .limit(50)

        if (queryError) throw queryError
        setUsers(data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : '랭킹을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-5 text-xl font-bold text-slate-900">🏆 코인 랭킹</h1>

      {loading && (
        <p className="py-10 text-center text-sm text-slate-500">랭킹을 불러오는 중...</p>
      )}

      {error && <p className="py-10 text-center text-sm text-rose-600">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">랭킹 데이터가 없어요.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <ol className="flex flex-col gap-2">
          {users.map((user, idx) => {
            const rank = idx + 1
            const isMe = user.id === currentUserId

            return (
              <li
                key={user.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  isMe
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="w-8 shrink-0 text-center text-lg">
                  {MEDALS[rank] ?? (
                    <span className="text-sm font-semibold text-slate-500">{rank}</span>
                  )}
                </span>

                <span
                  className={`flex-1 truncate font-medium ${
                    isMe ? 'text-amber-800' : 'text-slate-800'
                  }`}
                >
                  {user.nickname}
                  {isMe && <span className="ml-2 text-xs font-semibold">← 내 순위</span>}
                </span>

                <span
                  className={`shrink-0 text-sm font-semibold ${
                    isMe ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {user.coins.toLocaleString()} 코인
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
