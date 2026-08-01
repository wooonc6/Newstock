import { NextRequest, NextResponse } from 'next/server';

interface NaverNewsItem {
  title: string;
  description: string;
  link: string;
  originallink?: string;
  pubDate: string;
}

interface NaverNewsResponse {
  items?: NaverNewsItem[];
  total?: number;
  start?: number;
  display?: number;
}

// 뉴스 카테고리 자동 분류
function classifyTag(text: string): string {
  const t = text.toLowerCase();
  if (/삼성|sk하이닉스|현대차|lg|네이버|카카오|실적|영업이익|매출|어닝/.test(t)) return '기업실적';
  if (/금리|한국은행|금통위|기준금리|인하|인상/.test(t)) return '금리정책';
  if (/환율|달러|원화|외환|fomc|연준|파월/.test(t)) return '환율';
  if (/반도체|hbm|ddr|메모리|파운드리|tsmc|엔비디아/.test(t)) return '반도체';
  if (/코스피|코스닥|주가|주식|외국인|순매수|순매도/.test(t)) return '시장동향';
  if (/2차전지|배터리|전기차|리튬/.test(t)) return '2차전지';
  return '시장동향';
}

// HTML 태그 제거
function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// 날짜 → "n시간 전" 변환
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금 전';
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '주식 금리 반도체 환율';
  const requestedDisplay = Number.parseInt(searchParams.get('display') || '8', 10);
  const display = Number.isNaN(requestedDisplay)
    ? 8
    : Math.min(Math.max(requestedDisplay, 1), 100);
  const requestedStart = Number.parseInt(searchParams.get('start') || '1', 10);
  const start = Number.isNaN(requestedStart)
    ? 1
    : Math.min(Math.max(requestedStart, 1), 1000);
  const sort = searchParams.get('sort') === 'sim' ? 'sim' : 'date';

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: '네이버 API 키가 설정되지 않았어요.' },
      { status: 500 }
    );
  }

  try {
    const naverUrl = new URL('https://openapi.naver.com/v1/search/news.json');
    naverUrl.searchParams.set('query', query);
    naverUrl.searchParams.set('display', String(display));
    naverUrl.searchParams.set('start', String(start));
    naverUrl.searchParams.set('sort', sort);

    const response = await fetch(naverUrl.toString(), {
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      // Next.js 캐시 설정 — 10분마다 새로운 뉴스 가져오기
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      const providerMessage = await response.text().catch(() => '');
      console.error('[GET /api/news] Naver API error:', {
        status: response.status,
        body: providerMessage.slice(0, 500),
      });

      return NextResponse.json(
        { error: '최신 뉴스를 불러오지 못했어요.' },
        { status: 502 }
      );
    }

    const data = await response.json() as NaverNewsResponse;

    const items = (data.items || []).map((item) => ({
      title:       stripHtml(item.title),
      description: stripHtml(item.description),
      link:        item.originallink || item.link,
      pubDate:     item.pubDate,
      ago:         timeAgo(item.pubDate),
      tag:         classifyTag(item.title + ' ' + item.description),
    }));

    return NextResponse.json({
      items,
      total: data.total ?? items.length,
      start: data.start ?? start,
      display: data.display ?? items.length,
    });

  } catch (error) {
    console.error('[GET /api/news] Unexpected error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
