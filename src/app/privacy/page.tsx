import { BackButton } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pb-16 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-lg font-bold text-ink">개인정보처리방침</h1>
      </div>

      <p className="mb-6 text-xs text-ink-faint">시행일자: 2026년 8월 26일</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">1. 수집하는 개인정보 항목</h2>
          <p className="mb-2">
            Google·Apple·카카오 소셜 로그인 시 이메일 주소를 필수로 제공받으며, 로그인 제공자가
            함께 전달하는 프로필 이름·프로필 사진 URL이 있는 경우 계정 정보에 함께 저장될 수
            있습니다. 서비스 화면에는 이용자가 직접 설정한 닉네임과 이모지 아이콘만 표시됩니다.
          </p>
          <p className="mb-2">
            이 외에 이용자가 직접 등록하는 레시피 제목·재료·조리법·사진, AI 재료 추출을 위해
            입력하는 참고 링크(유튜브 등), 냉장고·장보기 항목, 가족 구성원과 공유하는 우리집
            정보를 수집합니다.
          </p>
          <p>
            유료 구독을 이용하는 경우 구독 상태·상품·만료일 정보가, 프로모션 코드를 사용하는
            경우 사용 코드와 만료일이, 푸시 알림을 켠 경우 기기 알림 토큰(또는 브라우저 구독
            정보)이 함께 수집됩니다. 신용카드 번호 등 결제수단 정보는 서비스가 직접 수집하지
            않으며, Apple(App Store)이 결제를 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">2. 개인정보의 처리 목적</h2>
          <p className="mb-2">
            서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하는 개인정보는 다음의
            목적 외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우 「개인정보 보호법」
            제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.
          </p>
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>
              <b className="text-ink">회원 가입 및 관리</b> — 회원 식별·인증, 회원자격 유지·관리,
              가족 구성원 간 우리집 공유, 서비스 부정 이용 방지
            </li>
            <li>
              <b className="text-ink">서비스 제공</b> — 레시피·냉장고·장보기 기능 제공, AI를
              이용한 재료·조리법 자동 정리, 유료 구독 이용 여부 확인 및 결제 상태 관리, 앱·웹
              푸시 알림 발송
            </li>
            <li>
              <b className="text-ink">서비스 개선</b> — 오류 개선, AI 자동 정리 결과 품질 향상
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴(마이페이지 &gt; 계정 관리 &gt; 계정 삭제) 시 지체 없이 파기합니다. 다만
            결제·구독 관련 기록은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년간,
            부정 이용 방지를 위한 접속 기록은 「통신비밀보호법」에 따라 3개월간 별도 보관 후
            파기합니다. 그 밖에 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">4. 개인정보 처리업무의 위탁</h2>
          <p className="mb-2">
            서비스 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다. 위탁받은
            업체에는 서비스 제공에 필요한 최소한의 정보만 전달되며, 위탁 계약을 통해 개인정보가
            안전하게 관리되도록 하고 있습니다. 아래 수탁자는 모두 국외에 소재하며, 이전되는
            항목·국가 등 상세 내용은 &ldquo;6. 개인정보의 국외 이전&rdquo;에서 함께 안내합니다.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Supabase Inc. — 데이터베이스, 회원 인증, 사진 등 파일 저장</li>
            <li>Google LLC (Firebase) — 앱 푸시 알림 발송</li>
            <li>Google LLC (Gemini API) — 레시피 링크의 재료·조리법 AI 자동 추출</li>
            <li>Google LLC (YouTube Data API) — 참고 영상의 제목·설명·댓글 조회</li>
            <li>RevenueCat, Inc. — 구독 결제 상태 확인 및 관리</li>
          </ul>
          <p className="mt-2 text-xs text-ink-faint">
            Vercel Inc.(웹·서버 호스팅)은 서울(icn1) 리전에서 서비스를 운영하므로 국내 위탁이며,
            개인정보가 국외로 이전되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">5. 개인정보의 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 특별한
            규정이 있거나 수사기관이 적법한 절차에 따라 요청하는 경우, 이용자가 별도로 동의한
            경우에 한해 예외적으로 제공할 수 있습니다. 구독 결제 시 결제 처리를 위해
            Apple Inc.에 결제 인증 정보가 제공되며, 장보기 목록의 제휴 쇼핑 링크(쿠팡파트너스
            등)를 이용하는 경우 검색어만 해당 쇼핑몰에 전달되고 이용자를 식별할 수 있는 정보는
            전달되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">6. 개인정보의 국외 이전</h2>
          <p className="mb-3">
            서비스는 서비스 제공을 위해 반드시 필요한 아래 업체와의 계약 이행을 위해(「개인정보
            보호법」 제28조의8제1항제3호), 회원가입 시 별도 동의 절차 없이 다음과 같이 개인정보를
            국외로 이전하고 있습니다. 웹·앱 서버(Vercel)만 국내(서울)에서 운영되며, 나머지는
            모두 국외에서 처리됩니다.
          </p>

          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-ink-faint">
                  <th className="py-1.5 pr-3 font-semibold">이전받는 자</th>
                  <th className="py-1.5 pr-3 font-semibold">국가</th>
                  <th className="py-1.5 pr-3 font-semibold">이전 항목</th>
                  <th className="py-1.5 pr-3 font-semibold">목적 · 보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border align-top">
                  <td className="py-1.5 pr-3">
                    Supabase Inc.
                    <br />
                    <span className="text-ink-faint">supabase.com/privacy</span>
                  </td>
                  <td className="py-1.5 pr-3">일본</td>
                  <td className="py-1.5 pr-3">1항의 전체 개인정보</td>
                  <td className="py-1.5 pr-3">DB·인증·파일 저장 / 회원 탈퇴 시까지</td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="py-1.5 pr-3">
                    Google LLC
                    <br />
                    <span className="text-ink-faint">policies.google.com/privacy</span>
                  </td>
                  <td className="py-1.5 pr-3">미국</td>
                  <td className="py-1.5 pr-3">이메일(로그인), 레시피 링크 내용, 알림 토큰</td>
                  <td className="py-1.5 pr-3">로그인·AI 추출·알림 발송 / 회원 탈퇴 또는 알림 해제 시까지</td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="py-1.5 pr-3">
                    Apple Inc.
                    <br />
                    <span className="text-ink-faint">apple.com/legal/privacy</span>
                  </td>
                  <td className="py-1.5 pr-3">미국</td>
                  <td className="py-1.5 pr-3">로그인 인증 정보, 구독 결제 정보</td>
                  <td className="py-1.5 pr-3">로그인·결제 처리 / 회원 탈퇴 또는 구독 해지 시까지</td>
                </tr>
                <tr className="align-top">
                  <td className="py-1.5 pr-3">
                    RevenueCat, Inc.
                    <br />
                    <span className="text-ink-faint">revenuecat.com/privacy</span>
                  </td>
                  <td className="py-1.5 pr-3">미국</td>
                  <td className="py-1.5 pr-3">우리집 식별자, 구독 상품·결제 상태</td>
                  <td className="py-1.5 pr-3">구독 상태 관리 / 회원 탈퇴 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3">
            <b className="text-ink">이전 시기 및 방법</b> — 회원가입, 로그인, 레시피 등록, 알림
            발송, 구독 결제 등 관련 기능을 이용하는 시점마다 TLS(HTTPS)로 암호화된 API 통신을
            통해 실시간으로 전송됩니다.
          </p>
          <p className="mt-2">
            <b className="text-ink">이전 거부 방법·절차 및 거부의 효과</b> — 위 업체들은 로그인,
            데이터 저장, 결제 처리 등 서비스 제공에 필수적인 기반이므로 개별 항목 단위로는 국외
            이전을 거부할 수 없습니다. 국외 이전 자체를 원하지 않으실 경우 마이페이지 &gt; 계정
            관리 &gt; 계정 삭제를 통해 회원 탈퇴하실 수 있으며, 탈퇴 시 서비스 이용이 종료되고
            보유 중인 개인정보는 제3항의 기간에 따라 파기됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">7. 개인정보의 안전성 확보조치</h2>
          <p className="mb-2">서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              <b className="text-ink">관리적 조치</b> — 개인정보 접근 권한을 개인정보 보호책임자
              1인으로 최소화하여 운영
            </li>
            <li>
              <b className="text-ink">기술적 조치</b> — 이용자와 서버 간 모든 통신 구간 TLS(HTTPS)
              암호화, Supabase의 행 단위 접근 제어(Row Level Security)를 통해 이용자가 자신이
              속한 우리집의 데이터에만 접근하도록 통제, 비밀번호를 발급·저장하지 않는 소셜
              로그인 전용 인증(비밀번호 유출 위험 자체가 없음), 결제수단 정보 비보유(Apple이
              직접 처리)
            </li>
            <li>
              <b className="text-ink">물리적 조치</b> — 자체 서버를 두지 않고 Vercel·Supabase 등
              보안 인증을 받은 클라우드 인프라만 이용하여 데이터센터 물리 보안을 각 사업자에게
              위탁
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">8. 이용자의 권리와 행사방법</h2>
          <p>
            이용자는 마이페이지에서 언제든지 본인의 프로필 정보를 열람·수정할 수 있으며, 계정
            삭제를 통해 자신의 개인정보 처리 정지 및 파기를 요청할 수 있습니다. 만 14세 미만
            아동의 회원가입은 지원하지 않으며, 만 14세 미만 아동의 개인정보가 수집된 사실을
            확인한 경우 지체 없이 파기합니다. 그 밖의 열람·정정·삭제 요청은 아래 문의처를 통해
            접수하며, 접수 즉시 지체 없이 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">9. 개인정보의 파기절차 및 방법</h2>
          <p>
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적
            파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며, 종이 문서에 기록된 정보는
            해당하지 않습니다(서비스는 개인정보를 전자적 형태로만 보유합니다).
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">10. 쿠키 등 자동 수집 장치의 운영</h2>
          <p>
            서비스는 로그인 상태 유지를 위해 브라우저 쿠키를 사용하며, 별도의 광고·분석용
            추적(트래킹) 도구는 사용하지 않습니다. 푸시 알림을 켠 경우 알림 발송을 위한 기기
            토큰이 저장되며, 마이페이지에서 알림을 끄면 함께 삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">11. 개인정보 보호책임자</h2>
          <p>
            서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고 이용자의 불만 처리 및 피해
            구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            <br />
            성명: 김혜지 · 이메일: hyehyehye1919@gmail.com
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">12. 권익침해 구제방법</h2>
          <p className="mb-2">
            이용자는 개인정보 침해로 인한 분쟁 해결, 상담 등 피해 구제를 받고자 하는 경우 아래
            기관에 신고·상담을 신청할 수 있습니다.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>개인정보 분쟁조정위원회 — (국번없이) 1833-6972 · www.kopico.go.kr</li>
            <li>개인정보침해 신고센터 — (국번없이) 118 · privacy.kisa.or.kr</li>
            <li>경찰청 — (국번없이) 182 · ecrm.police.go.kr</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">13. 문의처</h2>
          <p>
            개인정보 처리와 관련한 문의는 아래 이메일로 연락해주세요.
            <br />
            이메일: hyehyehye1919@gmail.com
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-bold text-ink">14. 고지의 의무</h2>
          <p>
            이 개인정보처리방침이 변경되는 경우, 변경 사항은 적용일자 최소 7일 전(수집하는
            개인정보 항목의 추가, 이용 목적 변경 등 중대한 변경의 경우 30일 전)부터 서비스 내
            공지 또는 이 페이지를 통해 고지합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
