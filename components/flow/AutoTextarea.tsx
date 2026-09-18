"use client";

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef } from "react";

export function AutoTextarea({
  value,
  onChange,
  focused,
  onFocused,
  className,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  focused?: boolean;
  onFocused?: () => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  // Re-measure when the column width changes, or a line that wrapped at one
  // width keeps the height it needed at the other.
  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    if (!focused) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    onFocused?.();
  }, [focused, onFocused]);

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      className={className}
      value={value}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
    />
  );
}
