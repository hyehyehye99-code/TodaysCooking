import Link from "next/link";
import { GlassCard } from "@/components/ui";

const FEATURES = [
  {
    emoji: "✨",
    title: "AI가 알아서 정리해줘요",
    description: "유튜브·인스타·블로그 링크 하나만 넣으면 재료와 만드는 법을 AI가 자동으로 정리해요.",
  },
  {
    emoji: "🧊",
    title: "냉장고, 탭 한 번으로",
    description: "지금 냉장고에 뭐가 있는지 탭 한 번으로 체크하고 관리해요.",
  },
  {
    emoji: "🔄",
    title: "레시피·냉장고·장보기가 하나로",
    description: "레시피에 부족한 재료는 장보기에 자동으로 담기고, 장보기를 끝내면 냉장고에도 알아서 반영돼요.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "가족과 함께 쓰는 부엌",
    description: "초대 코드 하나로 가족을 부엌에 초대하고, 레시피와 장보기 목록을 같이 관리해요.",
  },
  {
    emoji: "🔔",
    title: "무슨 일이 있었는지 알림으로",
    description: "가족이 장보기에 뭔가 추가하거나 장보기를 끝내면 바로 알려드려요.",
  },
  {
    emoji: "💌",
    title: "메뉴판을 자랑해보세요",
    description: "메뉴판을 외부에 공개 링크로 공유하고, 방문자의 하트 반응도 받아볼 수 있어요.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">소개</h1>
        <Link
          href="/mypage"
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={64} height={64} className="mb-4" />
        <h2 className="mb-2 text-lg font-bold leading-snug text-ink">
          흩어진 레시피를 한곳에,
          <br />
          필요한 재료를 한눈에!
        </h2>
        <p className="text-xs text-ink-soft">요리를 좋아하는 사람들을 위한, 가족이 함께 쓰는 메뉴판이에요</p>
      </div>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">왜 만들었나요</p>
      <GlassCard className="mb-8 bg-white p-4">
        <p className="text-sm leading-relaxed text-ink">
          유튜브·인스타·블로그에 저장만 해두고 막상 요리할 땐 어디 있는지 못 찾고, 장을 보러
          가서는 뭘 사야 할지 헷갈리고, 냉장고를 열어봐도 뭐가 있는지 몰라 요리를 미루게 되는
          반복되는 불편함이 있었어요. 그 불편함을 하나씩 없애다 보니 우리집 메뉴판이 됐어요.
        </p>
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">이런 게 좋아요</p>
      <div className="mb-8 flex flex-col gap-2.5">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} className="flex items-start gap-3 bg-white p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-base">
              {f.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{f.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{f.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <Link
        href="/recipes"
        className="mb-4 block w-full rounded-xl bg-accent py-3.5 text-center text-sm font-bold text-white"
      >
        메뉴판으로 돌아가기
      </Link>
    </div>
  );
}
