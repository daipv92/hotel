import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HotelProvider } from "@/components/hotel-provider";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, hotels(id, name)")
    .eq("id", user.id)
    .single();

  const hotel = profile?.hotels as unknown as {
    id: string;
    name: string;
  } | null;

  if (!hotel?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            Khong tim thay thong tin khach san. Vui long lien he quan tri vien.
          </p>
          <a
            href="/"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Quay lai trang chu
          </a>
        </div>
      </div>
    );
  }

  return (
    <HotelProvider hotelId={hotel.id} hotelName={hotel.name ?? ""}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar hotelName={hotel.name} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </HotelProvider>
  );
}
