import { BackButton } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-16 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-lg font-bold text-ink">개인정보처리방침</h1>
      </div>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">1. 수집하는 개인정보 항목</h2>
          <p>
            Google, Apple 등 소셜 로그인 시 이메일 주소·닉네임·프로필 사진을 제공받으며, 이용자가
            직접 등록하는 레시피·냉장고·장보기 정보, AI 재료 추출을 위해 입력하는 참고 링크(유튜브
            등)를 수집합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">2. 개인정보의 수집 및 이용 목적</h2>
          <p>
            회원 식별 및 로그인, 레시피·냉장고·장보기 기능 제공, 가족 구성원 간 부엌 공유, AI를
            이용한 재료·조리법 자동 정리, 푸시 알림 발송 목적으로 이용합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴(마이페이지 &gt; 계정 관리 &gt; 계정 삭제) 시 지체 없이 파기합니다. 단, 관계
            법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">4. 개인정보 처리 위탁 및 제3자 제공</h2>
          <p>
            서비스 운영을 위해 다음 업체에 개인정보 처리를 위탁하고 있습니다: 데이터베이스·인증
            (Supabase), 호스팅 (Vercel), AI 재료·조리법 추출 (Google Gemini API), 영상 정보 조회
            (YouTube Data API). 위 업체에는 서비스 제공에 필요한 최소한의 정보만 전달되며, 광고
            목적으로 제3자에게 개인정보를 제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">5. 이용자의 권리</h2>
          <p>
            이용자는 마이페이지에서 언제든지 본인의 프로필 정보를 열람·수정할 수 있으며, 계정 삭제를
            통해 자신의 개인정보 처리 정지 및 파기를 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">6. 문의처</h2>
          <p>
            개인정보 처리와 관련한 문의는 아래 이메일로 연락해주세요.
            <br />
            이메일: hyehyehye1919@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
