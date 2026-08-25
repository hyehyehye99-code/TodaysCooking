"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAuthed } from "@/lib/actions/onboarding";
import { BackButton } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-surface"}`}
        />
      ))}
    </div>
  );
}

export function OnboardingWizard({ householdMissingNotice = false }: { householdMissingNotice?: boolean }) {
  const dict = useDict();
  const [step, setStep] = useState<1 | 2>(1);

  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step1Error, setStep1Error] = useState("");

  const [nickname, setNickname] = useState("");
  const [step2Error, setStep2Error] = useState("");
  const [pending, startTransition] = useTransition();

  function goToNextFromStep1() {
    if (mode === "create" && !name.trim()) return setStep1Error(dict.onboarding.nameRequired);
    if (mode === "join" && !code.trim()) return setStep1Error(dict.onboarding.codeRequired);
    setStep1Error("");
    setStep(2);
  }

  function payload() {
    return { mode, name: name.trim(), code: code.trim(), nickname: nickname.trim() };
  }

  function handleSetupError(result: { error?: string; field?: "code" | "name" }) {
    if (result.field === "code" || result.field === "name") {
      setStep2Error("");
      setStep1Error(result.error ?? "");
      setStep(1);
    } else {
      setStep2Error(result.error ?? "");
    }
  }

  function handleFinish() {
    if (!nickname.trim()) return setStep2Error(dict.onboarding.nicknameRequired);
    startTransition(async () => {
      const result = await completeOnboardingAuthed(payload());
      if (result && "error" in result) handleSetupError(result);
    });
  }

  const totalSteps = 2;

  let primaryLabel = dict.onboarding.next;
  let primaryHandler = goToNextFromStep1;
  let primaryDisabled = false;

  if (step === 2) {
    primaryLabel = pending ? dict.onboarding.starting : dict.onboarding.start;
    primaryHandler = handleFinish;
    primaryDisabled = pending;
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-[max(env(safe-area-inset-top),24px)]">
        <StepDots step={step} total={totalSteps} />

        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <BackButton href="/login" className="mb-3" />

            <div className="flex flex-1 flex-col pt-4">
              {householdMissingNotice && (
                <p className="mb-4 rounded-xl border border-accent/20 bg-accent/8 px-3.5 py-2.5 text-xs font-semibold leading-snug text-accent-ink">
                  {dict.onboarding.previousHouseholdGone}
                </p>
              )}
              <h1 className="mb-1 text-[22px] font-bold">{dict.onboarding.heading}</h1>
              <p className="mb-10 text-sm text-ink-soft">{dict.onboarding.subheading}</p>

              <div className="mb-5 flex rounded-xl border border-transparent bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === "create" ? "bg-accent text-white" : "text-ink-soft"}`}
                >
                  {dict.onboarding.createNew}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("join")}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === "join" ? "bg-accent text-white" : "text-ink-soft"}`}
                >
                  {dict.onboarding.joinExisting}
                </button>
              </div>

              {mode === "create" ? (
                <ClearableInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict.onboarding.namePlaceholder}
                  className="w-full rounded-xl border border-transparent bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
                />
              ) : (
                <ClearableInput
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={dict.onboarding.codePlaceholder}
                  className="w-full rounded-xl border border-transparent bg-surface px-4 py-3.5 text-sm uppercase tracking-widest outline-none focus:border-accent"
                />
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col">
            <BackButton onClick={() => setStep(1)} className="mb-3" />

            <div className="flex flex-1 flex-col pt-4">
              <h1 className="mb-1 text-[22px] font-bold">{dict.onboarding.readyHeading}</h1>
              <p className="mb-6 text-sm text-ink-soft">{dict.onboarding.readySubheading}</p>

              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-ink-soft">{dict.onboarding.nicknameLabel}</span>
                  <ClearableInput
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={dict.onboarding.nicknamePlaceholder}
                    className="w-full rounded-xl border border-transparent bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
                  />
                  <span className="text-[11px] text-ink-faint">
                    {dict.onboarding.nicknamePreviewTemplate.replace(
                      "{name}",
                      nickname.trim() || dict.onboarding.nicknameLabel
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
        {step === 1 && step1Error && <p className="mb-2 text-sm text-warn-ink">{step1Error}</p>}
        {step === 2 && step2Error && <p className="mb-2 text-sm text-warn-ink">{step2Error}</p>}
        <button
          onClick={primaryHandler}
          disabled={primaryDisabled}
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
