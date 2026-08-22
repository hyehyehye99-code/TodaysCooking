import { BackButton } from "@/components/ui";

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-16 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-lg font-bold text-ink">고객 지원</h1>
      </div>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">문의하기</h2>
          <p>
            우리집 메뉴판 이용 중 궁금한 점이나 불편한 점이 있으시면 아래 이메일로 연락해주세요.
            빠르게 확인하고 답변드릴게요.
            <br />
            이메일:{" "}
            <a href="mailto:hyehyehye1919@gmail.com" className="font-semibold text-accent-ink">
              hyehyehye1919@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">자주 묻는 질문</h2>
          <p>
            로그인이 안 되거나 레시피·냉장고 정보가 보이지 않는 경우, 가입 시 사용한 로그인 방법
            (Google, Apple, 카카오)과 함께 문의해주시면 더 빠르게 도와드릴 수 있어요.
          </p>
        </section>
      </div>
    </div>
  );
}
