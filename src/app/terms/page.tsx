import { BackButton } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-16 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-lg font-bold text-ink">이용약관</h1>
      </div>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제1조 (목적)</h2>
          <p>
            이 약관은 우리집 레시피(이하 &quot;서비스&quot;)가 제공하는 레시피·냉장고·장보기 관리
            기능의 이용과 관련하여 서비스와 이용자의 권리, 의무 및 책임사항을 정하는 것을
            목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제2조 (서비스의 제공)</h2>
          <p>
            서비스는 Google, Apple 등 소셜 계정을 통한 로그인, 레시피 등록 및 관리, 냉장고 재고
            관리, 장보기 목록 관리, AI를 이용한 재료·조리법 자동 추출, 가족 구성원과의 우리집 공유
            기능을 제공합니다. 서비스의 내용은 운영상·기술상 필요에 따라 변경되거나 중단될 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제3조 (이용자의 의무)</h2>
          <p>
            이용자는 서비스 이용 시 관계 법령과 이 약관을 준수해야 하며, 타인의 계정을 도용하거나
            허위 정보를 등록하는 등 서비스 운영을 방해하는 행위를 해서는 안 됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제4조 (계정 관리 및 해지)</h2>
          <p>
            이용자는 마이페이지에서 언제든지 자신의 계정과 데이터를 삭제할 수 있습니다. 계정 삭제
            시 이용자가 등록한 레시피, 냉장고·장보기 데이터는 함께 삭제됩니다. 다만 여러 명이
            함께 쓰는 우리집의 경우, 다른 구성원이 등록한 데이터에는 영향을 주지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제5조 (면책조항)</h2>
          <p>
            서비스는 AI가 자동으로 생성한 재료·조리법 정보의 정확성을 보장하지 않으며, 이용자는
            실제 조리 시 이를 참고 자료로만 활용해야 합니다. 천재지변, 서비스 제공자의 고의·과실
            없는 서비스 중단으로 인한 손해에 대해서는 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제6조 (약관의 변경)</h2>
          <p>
            이 약관이 변경되는 경우, 변경된 약관은 서비스 내 공지 또는 이 페이지를 통해 고지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
