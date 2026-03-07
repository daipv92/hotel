"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_SECTIONS = [
  {
    label: "Quan ly dat phong",
    items: [
      {
        href: "/booking",
        label: "Dat phong",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        href: "/guests",
        label: "Khach hang",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: null,
    items: [
      {
        href: "/finance",
        label: "Thu Chi",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        href: "/settings",
        label: "Cau Hinh",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  },
];

export function Sidebar({ hotelName }: { hotelName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navContent = (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-200">
        <h1 className="text-base font-bold text-gray-900 truncate">{hotelName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className={isActive ? "text-blue-600" : "text-gray-400"}>{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 px-3 py-3">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Dang xuat
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-900 truncate">{hotelName}</span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-60 bg-white shadow-xl">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col border-r border-gray-200 bg-white">
        {navContent}
      </aside>
    </>
  );
}
