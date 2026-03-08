"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function SettingsNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const tabs = [
    { href: "/settings/categories", label: t("settingsCategories") },
    { href: "/settings/rooms", label: t("settingsRooms") },
    { href: "/settings/pricing", label: t("settingsPricing") },
    { href: "/settings/services", label: t("settingsServices") },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
