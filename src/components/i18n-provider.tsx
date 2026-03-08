"use client";

import React from "react";
import { I18nContext, useI18nState } from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const i18n = useI18nState();
  return (
    <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>
  );
}
