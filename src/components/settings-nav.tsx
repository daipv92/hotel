"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings/categories", label: "Loại phòng" },
  { href: "/settings/rooms", label: "Phòng" },
  { href: "/settings/pricing", label: "Bảng giá" },
  { href: "/settings/services", label: "Dịch vụ" },
];

export function SettingsNav() {
  const pathname = usePathname();

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
