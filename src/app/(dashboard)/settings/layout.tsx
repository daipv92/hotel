"use client";

import { SettingsNav } from "@/components/settings-nav";
import { useI18n } from "@/lib/i18n";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t("settingsTitle")}</h2>
      </div>
      <SettingsNav />
      <div className="py-4">{children}</div>
    </div>
  );
}
