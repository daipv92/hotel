import { SettingsNav } from "@/components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Cau hinh he thong</h2>
      </div>
      <SettingsNav />
      <div className="py-4">{children}</div>
    </div>
  );
}
