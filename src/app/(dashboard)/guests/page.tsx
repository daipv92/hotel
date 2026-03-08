"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import { useI18n } from "@/lib/i18n";
import type { Booking } from "@/types/database";

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " d";
}

type GuestBooking = Booking & {
  rooms?: { room_number: string };
};

export default function GuestsPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();

  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailBooking, setDetailBooking] = useState<GuestBooking | null>(null);
  const { t } = useI18n();

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, rooms(room_number)")
      .eq("hotel_id", hotelId)
      .eq("status", "checked_out")
      .order("check_out_at", { ascending: false })
      .limit(100);

    if (search.trim()) {
      query = query.or(
        `guest_name.ilike.%${search.trim()}%,guest_id_number.ilike.%${search.trim()}%`,
      );
    }

    const { data } = await query;
    setBookings((data as GuestBooking[]) ?? []);
    setLoading(false);
  }, [hotelId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(fetchGuests, 300);
    return () => clearTimeout(timer);
  }, [fetchGuests]);

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("guestsTitle")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("guestsSubtitle")}
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("guestsSearchPlaceholder")}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">{t("loading")}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          {search ? t("noGuestsFound") : t("noGuestHistory")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("thGuestName")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("thCCCD")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("thRoom")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("thCheckin")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("thCheckout")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    {t("thTotal")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setDetailBooking(b)}
                    className="border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {b.guest_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.guest_id_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.rooms?.room_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(b.check_in_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.check_out_at ? formatDateTime(b.check_out_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(b.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-gray-100">
            {bookings.map((b) => (
              <button
                key={b.id}
                onClick={() => setDetailBooking(b)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {b.guest_name}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(b.total_amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  {b.rooms?.room_number && (
                    <span>P.{b.rooms.room_number}</span>
                  )}
                  <span>{formatDateTime(b.check_in_at)}</span>
                  {b.guest_id_number && <span>{b.guest_id_number}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailBooking && (
        <GuestDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
        />
      )}
    </>
  );
}

// ─── Guest Detail Modal ───
function GuestDetailModal({
  booking,
  onClose,
}: {
  booking: GuestBooking;
  onClose: () => void;
}) {
  const supabase = createClient();
  const { t } = useI18n();
  const [services, setServices] = useState<
    { service_name: string; quantity: number; total_price: number }[]
  >([]);

  useEffect(() => {
    supabase
      .from("booking_services")
      .select("service_name, quantity, total_price")
      .eq("booking_id", booking.id)
      .order("created_at")
      .then(({ data }) => setServices(data ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pricingTypeLabels: Record<string, string> = {
    hourly: t("pricingHourly"),
    overnight: t("pricingOvernight"),
    daily: t("pricingDaily"),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {booking.guest_name}
              </h3>
              <p className="text-sm text-gray-500">
                {t("roomDetail")} {booking.rooms?.room_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {booking.guest_id_number && (
              <div>
                <p className="text-xs text-gray-500">{t("thCCCD")}</p>
                <p className="text-sm text-gray-700">
                  {booking.guest_id_number}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">{t("guestDetailGuestCount")}</p>
              <p className="text-sm text-gray-700">{booking.guest_count}</p>
            </div>
            {booking.pricing_type && (
              <div>
                <p className="text-xs text-gray-500">{t("guestDetailPricingType")}</p>
                <p className="text-sm text-gray-700">
                  {pricingTypeLabels[booking.pricing_type]}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">{t("checkinLabel")}</p>
              <p className="text-sm text-gray-700">
                {formatDateTime(booking.check_in_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("thCheckout")}</p>
              <p className="text-sm text-gray-700">
                {booking.check_out_at
                  ? formatDateTime(booking.check_out_at)
                  : "-"}
              </p>
            </div>
          </div>

          {booking.notes && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{t("notes")}</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                {t("guestDetailServicesUsed")}
              </p>
              <div className="rounded-lg border border-gray-200">
                {services.map((svc, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-3 py-2 text-sm ${i > 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <span className="text-gray-700">
                      {svc.service_name}{" "}
                      {svc.quantity > 1 && (
                        <span className="text-gray-400">x{svc.quantity}</span>
                      )}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(svc.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("guestDetailRoomCharge")}</span>
              <span className="text-gray-700">
                {formatPrice(booking.room_charge)}
              </span>
            </div>
            {booking.service_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("guestDetailServices")}</span>
                <span className="text-gray-700">
                  {formatPrice(booking.service_total)}
                </span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("guestDetailDiscount")}</span>
                <span className="text-red-600">
                  -{formatPrice(booking.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm font-semibold">
              <span className="text-gray-900">{t("guestDetailTotal")}</span>
              <span className="text-gray-900">
                {formatPrice(booking.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
