import { BackButton } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-16 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-lg font-bold text-ink">이용약관</h1>
      </div>

      <p className="mb-6 text-xs text-ink-faint">시행일자: 2026년 8월 26일</p>

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
            서비스는 Google·Apple·카카오 계정을 통한 로그인, 레시피 등록 및 관리, 냉장고 재고
            관리, 장보기 목록 관리, AI를 이용한 재료·조리법 자동 추출, 가족 구성원과의 우리집 공유,
            장보기 목록에서의 제휴 쇼핑 링크 안내 기능을 제공합니다. 핵심 기능은 별도 결제 없이
            무료로 이용할 수 있으며, 서비스의 내용은 운영상·기술상 필요에 따라 변경되거나 중단될
            수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제3조 (회원가입 및 계정)</h2>
          <p>
            서비스는 Google·Apple·카카오 소셜 로그인만을 통해 가입할 수 있으며, 별도의
            아이디·비밀번호를 발급하지 않습니다. 이용자는 계정 정보를 스스로 관리해야 하며, 계정의
            관리 소홀·부정 사용으로 발생하는 불이익에 대해 서비스는 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제4조 (유료 구독 서비스)</h2>
          <p className="mb-2">
            서비스는 AI 자동 정리 사용량을 확대해주는 &quot;우리집 레시피 프리미엄&quot; 월간 구독
            상품(월 3,300원, 부가세 포함)을 제공합니다. 무료 이용자는 레시피·냉장고·장보기 등
            핵심 기능을 구독 없이 계속 사용할 수 있으며, 구독은 AI 자동 정리 이용 한도를 늘리는
            선택적 부가 서비스입니다.
          </p>
          <p className="mb-2">
            구독 결제는 이용 중인 기기의 App Store(Apple)를 통해 이루어지며, 서비스는 결제수단
            정보를 직접 수집·저장하지 않습니다. 구독은 자동으로 갱신되며, 현재 결제 기간이
            종료되기 최소 24시간 전까지 해지하지 않으면 다음 결제 기간 요금이 자동으로 청구됩니다.
            결제는 현재 구독 기간이 끝나기 24시간 이내에 이용자의 App Store 계정으로 청구됩니다.
          </p>
          <p>
            구독 관리 및 해지는 iOS 기기의 [설정 &gt; Apple ID &gt; 구독] 메뉴에서 언제든 직접
            처리할 수 있으며, 서비스 내에서는 해당 메뉴로 바로 이동하는 링크만 제공합니다. 이미
            결제된 기간에 대한 환불은 Apple의 환불 정책에 따릅니다. 프로모션 코드로 부여된 무료
            이용 기간은 별도 결제 없이 코드에 명시된 기간 동안 적용되며 자동으로 갱신되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제5조 (이용자의 의무)</h2>
          <p>
            이용자는 서비스 이용 시 관계 법령과 이 약관을 준수해야 하며, 타인의 계정을 도용하거나
            허위 정보를 등록하는 등 서비스 운영을 방해하는 행위, 타인의 지식재산권·초상권을
            침해하는 게시물을 등록하는 행위를 해서는 안 됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제6조 (게시물의 관리)</h2>
          <p>
            이용자가 등록한 레시피·사진 등 게시물의 저작권은 이용자 본인에게 있습니다. 다만
            서비스는 게시물을 서비스 제공·운영·노출(우리집 공유, 공개 링크 공유 등)에 필요한
            범위 내에서 사용할 수 있습니다. 관계 법령을 위반하거나 타인의 권리를 침해하는 게시물은
            사전 통지 없이 삭제될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제7조 (계정 관리 및 해지)</h2>
          <p>
            이용자는 마이페이지에서 언제든지 자신의 계정과 데이터를 삭제할 수 있습니다. 계정 삭제
            시 이용자가 등록한 레시피, 냉장고·장보기 데이터는 함께 삭제됩니다. 다만 여러 명이
            함께 쓰는 우리집의 경우, 다른 구성원이 등록한 데이터에는 영향을 주지 않습니다. 계정을
            삭제해도 진행 중인 구독 결제는 자동으로 해지되지 않으므로, 제4조에 따라 App Store에서
            별도로 해지해야 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제8조 (지식재산권)</h2>
          <p>
            서비스가 제공하는 소프트웨어, 디자인, 로고, AI를 통한 자동 정리 기능 등에 대한
            지식재산권은 서비스 제공자에게 있습니다. 이용자는 서비스 제공자의 사전 동의 없이 이를
            복제·배포·상업적으로 이용할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제9조 (면책조항)</h2>
          <p>
            서비스는 AI가 자동으로 생성한 재료·조리법 정보의 정확성을 보장하지 않으며, 이용자는
            실제 조리 시 이를 참고 자료로만 활용해야 합니다. 장보기 목록의 제휴 쇼핑 링크를 통한
            구매는 이용자와 해당 쇼핑몰 간의 거래이며, 서비스는 그 거래에 대한 책임을 지지
            않습니다. 천재지변, 서비스 제공자의 고의·과실 없는 서비스 중단으로 인한 손해에
            대해서는 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제10조 (준거법 및 재판관할)</h2>
          <p>
            이 약관은 대한민국 법령에 따라 규율되고 해석되며, 서비스 이용과 관련하여 분쟁이
            발생할 경우 민사소송법상의 관할 법원에 소를 제기합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">제11조 (약관의 변경)</h2>
          <p>
            이 약관이 변경되는 경우, 변경된 약관은 적용일자 및 변경사유를 명시하여 적용일자 최소
            7일 전(이용자에게 불리하거나 중대한 변경의 경우 30일 전)부터 서비스 내 공지 또는 이
            페이지를 통해 고지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
