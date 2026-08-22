"use client";

import { forwardRef, useRef, useState, type InputHTMLAttributes } from "react";

// A plain <input class="..."> plus a native-iOS-style round "X" that clears
// it. Works for both controlled (value+onChange) and uncontrolled
// (name-only, read via FormData on submit) inputs: clearing sets the DOM
// value through the native setter and fires a real "input" event, so a
// controlled parent's onChange still gets called the normal way, and an
// uncontrolled form still sees the field as empty at submit time either way.
export const ClearableInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function ClearableInput({ className = "", onChange, value, ...props }, forwardedRef) {
    const innerRef = useRef<HTMLInputElement>(null);
    const isControlled = value !== undefined;
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
      () => String(props.defaultValue ?? "").length > 0
    );
    const hasValue = isControlled ? String(value ?? "").length > 0 : uncontrolledHasValue;

    function setRefs(node: HTMLInputElement | null) {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }

    function clear() {
      const input = innerRef.current;
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (!isControlled) setUncontrolledHasValue(false);
      input.focus();
    }

    return (
      <div className="relative">
        <input
          {...props}
          ref={setRefs}
          value={value}
          onChange={(e) => {
            if (!isControlled) setUncontrolledHasValue(e.target.value.length > 0);
            onChange?.(e);
          }}
          className={className}
          style={hasValue ? { paddingRight: "2.25rem" } : undefined}
        />
        {hasValue && (
          <button
            type="button"
            onClick={clear}
            tabIndex={-1}
            aria-label="지우기"
            className="absolute right-2.5 top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-ink-faint text-white"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
