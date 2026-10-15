"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/lib/ui";

export function PasswordField({
  label,
  name,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={labelClass}>
      {label}
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className={`${inputClass} h-12 w-full pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex min-w-11 items-center px-3 text-sm font-medium text-primary hover:underline"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </span>
    </label>
  );
}
