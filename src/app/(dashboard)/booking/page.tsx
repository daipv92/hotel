"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHotel } from "@/components/hotel-provider";
import { useI18n } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/i18n";
import type {
  RoomOccupancy,
  Booking,
  BookingService,
  Service,
  Room,
  PricingRule,
} from "@/types/database";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " d";
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeSince(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h${minutes > 0 ? `${minutes}p` : ""}`;
  return `${minutes}p`;
}

function isWithinHours(date: string, hours: number) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = target - now;
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

// ─── Icons ───
function BedIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14M3 11h18M5 11V9a2 2 0 012-2h3a2 2 0 012 2v2M12 11V9a2 2 0 012-2h3a2 2 0 012 2v2M3 17h18" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

// ─── Status config ───
const STATUS_CONFIG = {
  available: {
    label: "statusAvailable",
    leftBg: "bg-emerald-600",
    cardBg: "bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-emerald-100",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    iconColor: "text-white",
    statBg: "bg-gradient-to-br from-emerald-500 to-green-600",
  },
  occupied: {
    label: "statusOccupied",
    leftBg: "bg-red-600",
    cardBg: "bg-white border-blue-200 hover:border-blue-300 hover:shadow-blue-100",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
    iconColor: "text-white",
    statBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  dirty: {
    label: "statusDirty",
    leftBg: "bg-amber-500",
    cardBg: "bg-white border-amber-200 hover:border-amber-300 hover:shadow-amber-100",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    iconColor: "text-white",
    statBg: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
};

// ─── Status filter ───
type StatusFilter = "all" | "available" | "occupied" | "dirty";

export default function BookingPage() {
  const { hotelId } = useHotel();
  const supabase = createClient();

  const [rooms, setRooms] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal states
  const [checkinModal, setCheckinModal] = useState<{ room: RoomOccupancy; mode: "checkin" | "reserve" } | null>(null);
  const [detailModal, setDetailModal] = useState<RoomOccupancy | null>(null);
  const [serviceModal, setServiceModal] = useState<string | null>(null);
  const [changeRoomModal, setChangeRoomModal] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{ room: RoomOccupancy; x: number; y: number } | null>(null);
  const [reserveWarning, setReserveWarning] = useState<{ room: RoomOccupancy; action: "quick" | "checkin" } | null>(null);
  const { t } = useI18n();

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from("v_room_occupancy")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("floor_number")
      .order("category_name")
      .order("room_number");
    setRooms((data as RoomOccupancy[]) ?? []);
    setLoading(false);
  }, [hotelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const filtered =
    statusFilter === "all"
      ? rooms
      : rooms.filter((r) => r.status === statusFilter);

  const grouped = buildGrouped(filtered);

  const counts = {
    all: rooms.length,
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
  };

  function handleCardClick(room: RoomOccupancy, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActionMenu({ room, x: rect.left, y: rect.bottom + 4 });
  }

  async function handleQuickCheckin(room: RoomOccupancy) {
    await supabase.from("bookings").insert({
      hotel_id: hotelId,
      room_id: room.room_id,
      guest_name: t("defaultGuestName"),
      guest_count: 1,
      status: "checked_in",
      check_in_at: new Date().toISOString(),
      room_charge: 0,
    });
    await supabase
      .from("rooms")
      .update({ status: "occupied" })
      .eq("id", room.room_id);
    fetchRooms();
  }

  async function handleMarkClean(roomId: string) {
    await supabase
      .from("rooms")
      .update({ status: "available" })
      .eq("id", roomId);
    fetchRooms();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { key: "all" as StatusFilter, label: t("statTotal"), icon: <BedIcon className="h-6 w-6" />, bg: "bg-gradient-to-br from-gray-600 to-gray-800" },
            { key: "available" as StatusFilter, label: t("statAvailable"), icon: <BedIcon className="h-6 w-6" />, bg: STATUS_CONFIG.available.statBg },
            { key: "occupied" as StatusFilter, label: t("statOccupied"), icon: <UserIcon className="h-6 w-6" />, bg: STATUS_CONFIG.occupied.statBg },
            { key: "dirty" as StatusFilter, label: t("statDirty"), icon: <SparklesIcon className="h-6 w-6" />, bg: STATUS_CONFIG.dirty.statBg },
          ]
        ).map(({ key, label, icon, bg }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${bg} ${
              statusFilter === key ? "ring-2 ring-offset-2 ring-blue-400" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{counts[key]}</p>
                <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
              </div>
              <div className="rounded-xl bg-white/20 p-2">{icon}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Legend bar */}
      <div className="mb-4 flex items-center gap-4 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t("legendLabel")}</span>
        {(
          [
            { status: "available" as const, label: t("legendAvailable") },
            { status: "occupied" as const, label: t("legendOccupied") },
            { status: "dirty" as const, label: t("legendDirty") },
          ]
        ).map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full ${STATUS_CONFIG[status].dot}`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Room cards grouped by floor -> category */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <BedIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">{t("noRooms")}</p>
          <p className="mt-1 text-xs text-gray-400">{t("noRoomsHint")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((floor) => (
            <div key={floor.floorNumber}>
              {/* Floor header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                  {floor.floorNumber}
                </div>
                <h2 className="text-base font-bold text-gray-900">{floor.floorName}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-5 pl-2">
                {floor.categories.map((cat) => (
                  <div key={cat.categoryName}>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-600">{cat.categoryName}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {cat.rooms.length} {t("roomCount")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {cat.rooms.map((room) => {
                        const cfg = STATUS_CONFIG[room.status];
                        const isSelected = actionMenu?.room.room_id === room.room_id;
                        return (
                          <button
                            key={room.room_id}
                            onClick={(e) => handleCardClick(room, e)}
                            className={`group relative flex overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.99] ${cfg.cardBg} ${isSelected ? "ring-2 ring-blue-400 shadow-md" : ""}`}
                          >
                            {/* Left panel - colored */}
                            <div className={`flex w-20 flex-shrink-0 flex-col items-center justify-center gap-1 ${cfg.leftBg} py-3`}>
                              <span className="text-[10px] font-medium text-white/80 leading-tight text-center px-1 truncate w-full">
                                {room.category_name}
                              </span>
                              <span className="text-2xl font-extrabold text-white leading-none">
                                {room.room_number}
                              </span>
                              <div className={cfg.iconColor}>
                                {room.status === "occupied" ? (
                                  <BedIcon className="h-4 w-4" />
                                ) : room.status === "dirty" ? (
                                  <SparklesIcon className="h-4 w-4" />
                                ) : (
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Right panel - info */}
                            <div className="flex flex-1 flex-col justify-center gap-0.5 px-3 py-2.5 text-left min-w-0">
                              {/* Reservation banner on top */}
                              {room.future_booking_id && (
                                <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 -mx-1 mb-0.5 ${
                                  room.future_check_in && isWithinHours(room.future_check_in, 2)
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-violet-50 border border-violet-200"
                                }`}>
                                  <svg className={`h-3 w-3 flex-shrink-0 ${
                                    room.future_check_in && isWithinHours(room.future_check_in, 2)
                                      ? "text-red-500"
                                      : "text-violet-500"
                                  }`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                                  </svg>
                                  <p className={`text-[11px] font-semibold truncate ${
                                    room.future_check_in && isWithinHours(room.future_check_in, 2)
                                      ? "text-red-700"
                                      : "text-violet-700"
                                  }`}>
                                    {room.future_guest}
                                    {room.future_check_in && (
                                      <span className="font-normal"> - {formatDateTime(room.future_check_in)}</span>
                                    )}
                                  </p>
                                </div>
                              )}

                              {room.status === "available" && !room.future_booking_id && (
                                <span className={`text-sm font-bold ${cfg.text}`}>
                                  {t("roomAvailable")}
                                </span>
                              )}

                              {room.status === "available" && room.future_booking_id && !room.current_guest && (
                                <span className="text-xs text-gray-400">
                                  {t("roomAvailableReserved")}
                                </span>
                              )}

                              {room.status === "occupied" && (
                                <>
                                  <p className="truncate text-sm font-bold text-gray-900">
                                    {room.current_guest || t("defaultGuestName")}
                                  </p>
                                  {room.check_in_at && (
                                    <p className="text-xs text-gray-500">
                                      {formatDateTime(room.check_in_at)}
                                      {" - "}
                                      <span className="font-medium text-blue-600">{timeSince(room.check_in_at)}</span>
                                    </p>
                                  )}
                                </>
                              )}

                              {room.status === "dirty" && (
                                <span className="text-sm font-medium text-amber-600">
                                  {t("needsCleaning")}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-in / Reserve Modal */}
      {checkinModal && (
        <CheckinModal
          room={checkinModal.room}
          mode={checkinModal.mode}
          hotelId={hotelId}
          onClose={() => setCheckinModal(null)}
          onSuccess={() => {
            setCheckinModal(null);
            fetchRooms();
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {detailModal && (
        <DetailModal
          room={detailModal}
          hotelId={hotelId}
          onClose={() => setDetailModal(null)}
          onRefresh={() => {
            setDetailModal(null);
            fetchRooms();
          }}
          onAddService={(bookingId) => {
            setDetailModal(null);
            setServiceModal(bookingId);
          }}
          onChangeRoom={(bookingId) => {
            setDetailModal(null);
            setChangeRoomModal(bookingId);
          }}
        />
      )}

      {/* Add Service Modal */}
      {serviceModal && (
        <AddServiceModal
          bookingId={serviceModal}
          hotelId={hotelId}
          onClose={() => setServiceModal(null)}
          onSuccess={() => {
            setServiceModal(null);
            fetchRooms();
          }}
        />
      )}

      {/* Change Room Modal */}
      {changeRoomModal && (
        <ChangeRoomModal
          bookingId={changeRoomModal}
          hotelId={hotelId}
          onClose={() => setChangeRoomModal(null)}
          onSuccess={() => {
            setChangeRoomModal(null);
            fetchRooms();
          }}
        />
      )}

      {/* Room Action Menu */}
      {actionMenu && (
        <RoomActionMenu
          room={actionMenu.room}
          anchorX={actionMenu.x}
          anchorY={actionMenu.y}
          onClose={() => setActionMenu(null)}
          onQuickCheckin={() => {
            const room = actionMenu.room;
            setActionMenu(null);
            if (room.future_booking_id && room.future_check_in && isWithinHours(room.future_check_in, 2)) {
              setReserveWarning({ room, action: "quick" });
            } else {
              handleQuickCheckin(room);
            }
          }}
          onCheckin={() => {
            const room = actionMenu.room;
            setActionMenu(null);
            if (room.future_booking_id && room.future_check_in && isWithinHours(room.future_check_in, 2)) {
              setReserveWarning({ room, action: "checkin" });
            } else {
              setCheckinModal({ room, mode: "checkin" });
            }
          }}
          onSchedule={() => {
            setActionMenu(null);
            setCheckinModal({ room: actionMenu.room, mode: "reserve" });
          }}
          onViewDetail={() => {
            setActionMenu(null);
            setDetailModal(actionMenu.room);
          }}
          onCheckout={() => {
            setActionMenu(null);
            setDetailModal(actionMenu.room);
          }}
          onAddService={async () => {
            const bookingId = await getBookingId(actionMenu.room.room_id);
            setActionMenu(null);
            if (bookingId) setServiceModal(bookingId);
          }}
          onChangeRoom={async () => {
            const bookingId = await getBookingId(actionMenu.room.room_id);
            setActionMenu(null);
            if (bookingId) setChangeRoomModal(bookingId);
          }}
          onMarkClean={() => {
            setActionMenu(null);
            handleMarkClean(actionMenu.room.room_id);
          }}
        />
      )}

      {/* Reserve Warning Dialog */}
      {reserveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-center text-base font-bold text-gray-900 mb-2">
                {t("reserveWarningTitle")}
              </h3>
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
                <p className="text-sm text-red-700">
                  <strong>{reserveWarning.room.future_guest}</strong> {t("reserveWarningMessage").replace("{room}", reserveWarning.room.room_number)}{" "}
                  <strong>{reserveWarning.room.future_check_in ? formatDateTime(reserveWarning.room.future_check_in) : ""}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500 text-center mb-5">
                {t("reserveWarningConfirm")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setReserveWarning(null)}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => {
                    const { room, action } = reserveWarning;
                    setReserveWarning(null);
                    if (action === "quick") {
                      handleQuickCheckin(room);
                    } else {
                      setCheckinModal({ room, mode: "checkin" });
                    }
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:shadow-xl"
                >
                  {t("continue")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  async function getBookingId(roomId: string): Promise<string | null> {
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "checked_in")
      .order("check_in_at", { ascending: false })
      .limit(1)
      .single();
    return data?.id ?? null;
  }
}

// ─── Helper: group rooms by floor -> category ───
function buildGrouped(rooms: RoomOccupancy[]) {
  const floorMap = new Map<
    number,
    { floorName: string; floorNumber: number; catMap: Map<string, RoomOccupancy[]> }
  >();

  for (const room of rooms) {
    let floor = floorMap.get(room.floor_number);
    if (!floor) {
      floor = {
        floorName: room.floor_name,
        floorNumber: room.floor_number,
        catMap: new Map(),
      };
      floorMap.set(room.floor_number, floor);
    }
    let catRooms = floor.catMap.get(room.category_name);
    if (!catRooms) {
      catRooms = [];
      floor.catMap.set(room.category_name, catRooms);
    }
    catRooms.push(room);
  }

  return Array.from(floorMap.values())
    .sort((a, b) => a.floorNumber - b.floorNumber)
    .map((floor) => ({
      ...floor,
      categories: Array.from(floor.catMap.entries()).map(
        ([categoryName, rooms]) => ({ categoryName, rooms }),
      ),
    }));
}

// ─── Room Action Menu ───
function RoomActionMenu({
  room,
  anchorX,
  anchorY,
  onClose,
  onQuickCheckin,
  onCheckin,
  onSchedule,
  onViewDetail,
  onCheckout,
  onAddService,
  onChangeRoom,
  onMarkClean,
}: {
  room: RoomOccupancy;
  anchorX: number;
  anchorY: number;
  onClose: () => void;
  onQuickCheckin: () => void;
  onCheckin: () => void;
  onSchedule: () => void;
  onViewDetail: () => void;
  onCheckout: () => void;
  onAddService: () => void;
  onChangeRoom: () => void;
  onMarkClean: () => void;
}) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: anchorX, y: anchorY });

  useEffect(() => {
    // Adjust position if menu overflows viewport
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let x = anchorX;
    let y = anchorY;
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
    if (x < 8) x = 8;
    if (y + rect.height > window.innerHeight - 8) y = anchorY - rect.height - 8;
    setPos({ x, y });
  }, [anchorX, anchorY]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const cfg = STATUS_CONFIG[room.status];

  type MenuItem = { label: string; icon: React.ReactNode; onClick: () => void; variant?: "danger" };

  const items: MenuItem[] = [];

  if (room.status === "available") {
    items.push({
      label: t("actionQuickCheckin"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onQuickCheckin,
    });
    items.push({
      label: t("actionCheckinWithInfo"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25h5.5a.75.75 0 010 1.5h-5.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-5.5a.75.75 0 011.5 0v5.5a1.75 1.75 0 01-1.75 1.75h-8.5a1.75 1.75 0 01-1.75-1.75v-8.5z" />
        </svg>
      ),
      onClick: onCheckin,
    });
    items.push({
      label: t("actionReserve"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onSchedule,
    });
  }

  if (room.status === "occupied") {
    items.push({
      label: t("actionViewDetail"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onViewDetail,
    });
    items.push({
      label: t("actionAddService"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onAddService,
    });
    items.push({
      label: t("actionChangeRoom"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.06-7.666a.75.75 0 01.744.648l.007.102v2.033l-.312-.311a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H11.48a.75.75 0 100 1.5h3.634a.75.75 0 00.75-.75V4.358a.75.75 0 00-.75-.75h-.001z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onChangeRoom,
    });
    items.push({
      label: t("actionCheckout"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
        </svg>
      ),
      onClick: onCheckout,
      variant: "danger",
    });
  }

  if (room.status === "dirty") {
    items.push({
      label: t("actionMarkClean"),
      icon: <SparklesIcon className="h-4 w-4" />,
      onClick: onMarkClean,
    });
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-50 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Menu header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-gray-900">{room.room_number}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {t(cfg.label as TranslationKeys)}
            </span>
          </div>
          {room.status === "occupied" && room.current_guest && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">{room.current_guest}</p>
          )}
        </div>

        {/* Menu items */}
        <div className="py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className={item.variant === "danger" ? "text-red-400" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Check-in Modal ───
function CheckinModal({
  room,
  mode,
  hotelId,
  onClose,
  onSuccess,
}: {
  room: RoomOccupancy;
  mode: "checkin" | "reserve";
  hotelId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isReserve = mode === "reserve";
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();
  const [form, setForm] = useState({
    guest_name: "",
    guest_id_number: "",
    guest_count: "1",
    notes: "",
    expected_check_in: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guest_name.trim()) return;
    if (isReserve && !form.expected_check_in) {
      alert(t("reserveValidationDate"));
      return;
    }
    if (isReserve && form.expected_check_in && new Date(form.expected_check_in) <= new Date()) {
      alert(t("reserveValidationFuture"));
      return;
    }
    setSaving(true);

    const checkInAt = isReserve && form.expected_check_in
      ? new Date(form.expected_check_in).toISOString()
      : new Date().toISOString();

    const { error } = await supabase.from("bookings").insert({
      hotel_id: hotelId,
      room_id: room.room_id,
      guest_name: form.guest_name.trim(),
      guest_id_number: form.guest_id_number.trim() || null,
      guest_count: Number(form.guest_count) || 1,
      notes: form.notes.trim() || null,
      room_charge: 0,
      status: isReserve ? "reserved" : "checked_in",
      check_in_at: checkInAt,
    });

    if (!error) {
      if (!isReserve) {
        await supabase
          .from("rooms")
          .update({ status: "occupied" })
          .eq("id", room.room_id);
      }
      onSuccess();
    } else {
      console.error("Booking insert error:", error);
      alert(t("errorPrefix") + error.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`rounded-t-2xl bg-gradient-to-r px-6 py-5 text-white ${isReserve ? "from-violet-500 to-purple-600" : "from-emerald-500 to-green-600"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <BedIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{isReserve ? t("reserve") : t("checkin")} {room.room_number}</h3>
              <p className="text-sm text-white/80">{room.category_name}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Future booking warning */}
          {room.future_booking_id && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-700">
                {t("reserveWarningBanner")} <strong>{room.future_guest}</strong> {t("reserveWarningBannerAt")}{" "}
                {room.future_check_in ? formatDateTime(room.future_check_in) : ""}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                {t("guestNameLabel")}
              </label>
              <input
                type="text"
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                required
                autoFocus
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder={t("guestNamePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("idNumberLabel")}
                </label>
                <input
                  type="text"
                  value={form.guest_id_number}
                  onChange={(e) => setForm({ ...form, guest_id_number: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("guestCountLabel")}
                </label>
                <input
                  type="number"
                  value={form.guest_count}
                  onChange={(e) => setForm({ ...form, guest_count: e.target.value })}
                  min="1"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {isReserve && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("expectedCheckinLabel")}
                </label>
                <input
                  type="datetime-local"
                  value={form.expected_check_in}
                  onChange={(e) => setForm({ ...form, expected_check_in: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                {t("notes")}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={`w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all ${isReserve ? "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" : "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"}`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 ${isReserve ? "from-violet-500 to-purple-600 shadow-violet-200 hover:shadow-violet-200" : "from-emerald-500 to-green-600 shadow-emerald-200 hover:shadow-emerald-200"}`}
              >
                {saving ? t("processing") : isReserve ? t("reserveBooking") : t("checkin")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ───
function DetailModal({
  room,
  hotelId,
  onClose,
  onRefresh,
  onAddService,
  onChangeRoom,
}: {
  room: RoomOccupancy;
  hotelId: string;
  onClose: () => void;
  onRefresh: () => void;
  onAddService: (bookingId: string) => void;
  onChangeRoom: (bookingId: string) => void;
}) {
  const supabase = createClient();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { t } = useI18n();
  const [, setTick] = useState(0);

  // Re-render every 60s to update auto-calculated price
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-calculate pricing based on duration
  function calcAutoPrice(checkInAt: string, rules: PricingRule[]) {
    const now = new Date();
    const checkIn = new Date(checkInAt);
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const hourlyRule = rules.find((r) => r.pricing_type === "hourly");
    const overnightRule = rules.find((r) => r.pricing_type === "overnight");
    const dailyRule = rules.find((r) => r.pricing_type === "daily");

    // Start with hourly pricing
    let bestType: "hourly" | "overnight" | "daily" = "hourly";
    let bestPrice = 0;

    if (hourlyRule) {
      const minHours = hourlyRule.min_hours ?? 1;
      const baseHours = Math.max(minHours, Math.ceil(diffHours));
      bestPrice = hourlyRule.price;
      if (diffHours > minHours && hourlyRule.extra_hour_price) {
        const extraHours = Math.ceil(diffHours) - minHours;
        bestPrice = hourlyRule.price + extraHours * hourlyRule.extra_hour_price;
      }
    }

    // Check if overnight is cheaper
    if (overnightRule && overnightRule.price < bestPrice) {
      bestType = "overnight";
      bestPrice = overnightRule.price;
    }

    // Check if daily is cheaper (for stays >= ~24h or when daily is cheaper)
    if (dailyRule) {
      const days = Math.max(1, Math.ceil(diffHours / 24));
      const dailyTotal = dailyRule.price * days;
      if (dailyTotal < bestPrice || !hourlyRule) {
        bestType = "daily";
        bestPrice = dailyTotal;
      }
    }

    // Fallback: if no rules, price stays 0
    if (!hourlyRule && !overnightRule && !dailyRule) {
      return { type: null as "hourly" | "overnight" | "daily" | null, price: 0 };
    }

    return { type: bestType, price: bestPrice };
  }

  useEffect(() => {
    async function fetchBooking() {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("room_id", room.room_id)
        .eq("status", "checked_in")
        .order("check_in_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setBooking(data);
        const [svcRes, roomRes] = await Promise.all([
          supabase
            .from("booking_services")
            .select("*")
            .eq("booking_id", data.id)
            .order("created_at"),
          supabase
            .from("rooms")
            .select("room_category_id")
            .eq("id", room.room_id)
            .single(),
        ]);
        setServices(svcRes.data ?? []);

        if (roomRes.data?.room_category_id) {
          const { data: rules } = await supabase
            .from("pricing_rules")
            .select("*")
            .eq("room_category_id", roomRes.data.room_category_id)
            .eq("is_active", true);
          setPricingRules(rules ?? []);
        }
      }
      setLoading(false);
    }
    fetchBooking();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-calculate room charge live
  const autoCalc = booking ? calcAutoPrice(booking.check_in_at, pricingRules) : null;

  async function handleCheckout() {
    if (!booking) return;
    if (!confirm(t("confirmCheckout") + " " + room.room_number + "?")) return;
    setCheckingOut(true);

    const finalCalc = calcAutoPrice(booking.check_in_at, pricingRules);
    const finalRoomCharge = finalCalc.price;
    const totalServices = services.reduce((sum, s) => sum + s.total_price, 0);

    await supabase
      .from("bookings")
      .update({
        status: "checked_out",
        check_out_at: new Date().toISOString(),
        pricing_type: finalCalc.type,
        room_charge: finalRoomCharge,
        total_amount: finalRoomCharge + totalServices - booking.discount,
      })
      .eq("id", booking.id);

    await supabase
      .from("rooms")
      .update({ status: "dirty" })
      .eq("id", room.room_id);

    onRefresh();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <p className="text-sm text-gray-500">{t("noBookingFound")}</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            {t("close")}
          </button>
        </div>
      </div>
    );
  }

  const pricingTypeLabels: Record<string, string> = {
    hourly: t("pricingHourly"),
    overnight: t("pricingOvernight"),
    daily: t("pricingDaily"),
  };

  const displayRoomCharge = autoCalc?.price ?? booking.room_charge;
  const displayPricingType = autoCalc?.type ?? booking.pricing_type;
  const totalServices = services.reduce((sum, s) => sum + s.total_price, 0);
  const grandTotal = displayRoomCharge + totalServices - booking.discount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl font-extrabold">
                {room.room_number}
              </div>
              <div>
                <h3 className="text-lg font-bold">{t("roomDetail")} {room.room_number}</h3>
                <p className="text-sm text-white/80">{room.category_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {/* Time badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{timeSince(booking.check_in_at)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Guest info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs font-medium text-gray-400">{t("guestLabel")}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{booking.guest_name}</p>
            </div>
            {booking.guest_id_number && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-400 mb-1">{t("idLabel")}</p>
                <p className="text-sm font-semibold text-gray-700">{booking.guest_id_number}</p>
              </div>
            )}
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">{t("checkinLabel")}</p>
              <p className="text-sm font-semibold text-gray-700">{formatDateTime(booking.check_in_at)}</p>
            </div>
            {displayPricingType && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-400 mb-1">{t("pricingTypeLabel")}</p>
                <p className="text-sm font-semibold text-gray-700">{pricingTypeLabels[displayPricingType]}</p>
              </div>
            )}
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">{t("guestCountLabel")}</p>
              <p className="text-sm font-semibold text-gray-700">{booking.guest_count}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-medium text-blue-400 mb-1">{t("notes")}</p>
              <p className="text-sm text-blue-700">{booking.notes}</p>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("servicesUsed")}
              </p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {services.map((svc, i) => (
                  <div
                    key={svc.id}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${i > 0 ? "border-t border-gray-100" : ""} ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <span className="text-gray-700 font-medium">
                      {svc.service_name}{" "}
                      {svc.quantity > 1 && (
                        <span className="text-gray-400 font-normal">x{svc.quantity}</span>
                      )}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(svc.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("roomChargeLabel")}</span>
              <span className="font-medium text-gray-700">{formatPrice(displayRoomCharge)}</span>
            </div>
            {totalServices > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("serviceLabel")}</span>
                <span className="font-medium text-gray-700">{formatPrice(totalServices)}</span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("discountLabel")}</span>
                <span className="font-semibold text-red-500">-{formatPrice(booking.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300/50 pt-2">
              <span className="text-sm font-bold text-gray-900">{t("totalLabel")}</span>
              <span className="text-lg font-extrabold text-gray-900">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Future booking warning */}
          {room.future_booking_id && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-700">
                {t("reserveWarningBanner")} <strong>{room.future_guest}</strong> {t("reserveWarningBannerAt")}{" "}
                {room.future_check_in ? formatDateTime(room.future_check_in) : ""}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onAddService(booking.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {t("serviceLabel")}
            </button>
            <button
              onClick={() => onChangeRoom(booking.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.06-7.666a.75.75 0 01.744.648l.007.102v2.033l-.312-.311a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H11.48a.75.75 0 100 1.5h3.634a.75.75 0 00.75-.75V4.358a.75.75 0 00-.75-.75h-.001z" clipRule="evenodd" />
              </svg>
              {t("actionChangeRoom")}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:shadow-red-200 disabled:opacity-50"
            >
              {checkingOut ? t("processing") : t("actionCheckout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Service Modal ───
function AddServiceModal({
  bookingId,
  hotelId,
  onClose,
  onSuccess,
}: {
  bookingId: string;
  hotelId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();
  const [selected, setSelected] = useState<
    { service: Service; quantity: number }[]
  >([]);

  useEffect(() => {
    supabase
      .from("services")
      .select("*, service_categories(*)")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .order("name")
      .then(({ data }) => {
        setServices(data ?? []);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleService(svc: Service) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.service.id === svc.id);
      if (exists) return prev.filter((s) => s.service.id !== svc.id);
      return [...prev, { service: svc, quantity: 1 }];
    });
  }

  function updateQuantity(svcId: string, qty: number) {
    setSelected((prev) =>
      prev.map((s) =>
        s.service.id === svcId ? { ...s, quantity: Math.max(1, qty) } : s,
      ),
    );
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setSaving(true);

    const inserts = selected.map((s) => ({
      booking_id: bookingId,
      service_id: s.service.id,
      service_name: s.service.name,
      quantity: s.quantity,
      unit_price: s.service.price,
      total_price: s.service.price * s.quantity,
    }));

    const { error } = await supabase.from("booking_services").insert(inserts);

    if (!error) {
      const totalAdded = inserts.reduce((sum, i) => sum + i.total_price, 0);
      const { data: currentBooking } = await supabase
        .from("bookings")
        .select("service_total, room_charge, discount")
        .eq("id", bookingId)
        .single();

      if (currentBooking) {
        const newServiceTotal = currentBooking.service_total + totalAdded;
        await supabase
          .from("bookings")
          .update({
            service_total: newServiceTotal,
            total_amount:
              currentBooking.room_charge +
              newServiceTotal -
              currentBooking.discount,
          })
          .eq("id", bookingId);
      }

      for (const s of selected) {
        await supabase
          .from("services")
          .update({ usage_count: s.service.usage_count + s.quantity })
          .eq("id", s.service.id);
      }

      onSuccess();
    } else {
      alert(t("errorPrefix") + error.message);
      setSaving(false);
    }
  }

  const total = selected.reduce(
    (sum, s) => sum + s.service.price * s.quantity,
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5 text-white">
          <h3 className="text-lg font-bold">{t("addServiceTitle")}</h3>
          <p className="text-sm text-white/80">{t("addServiceSubtitle")}</p>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
              <p className="text-sm text-gray-500">{t("loading")}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {t("noServicesYet")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {services.map((svc) => {
                const sel = selected.find((s) => s.service.id === svc.id);
                return (
                  <div
                    key={svc.id}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all cursor-pointer ${
                      sel
                        ? "border-violet-300 bg-violet-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => toggleService(svc)}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${sel ? "bg-violet-200 text-violet-700" : "bg-gray-100 text-gray-400"}`}>
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        {sel ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {svc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(svc.price)} / {svc.unit}
                        {svc.service_categories && (
                          <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                            {svc.service_categories.name}
                          </span>
                        )}
                      </p>
                    </div>
                    {sel && (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateQuantity(svc.id, sel.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {sel.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(svc.id, sel.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-sm font-bold hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
          {selected.length > 0 && (
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 mr-1">
                  {selected.length}
                </span>
                {t("serviceCount")}
              </span>
              <span className="text-base font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || selected.length === 0}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-200 disabled:opacity-50"
            >
              {saving ? t("saving") : t("confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Change Room Modal ───
function ChangeRoomModal({
  bookingId,
  hotelId,
  onClose,
  onSuccess,
}: {
  bookingId: string;
  hotelId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    async function fetchData() {
      const [bookingRes, roomsRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("id", bookingId).single(),
        supabase
          .from("rooms")
          .select("*, floors(*), room_categories(*)")
          .eq("hotel_id", hotelId)
          .eq("status", "available")
          .order("room_number"),
      ]);
      setBooking(bookingRes.data);
      setAvailableRooms(roomsRes.data ?? []);
      setLoading(false);
    }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom || !booking) return;
    setSaving(true);

    await supabase.from("room_changes").insert({
      booking_id: bookingId,
      from_room_id: booking.room_id,
      to_room_id: selectedRoom,
      reason: reason.trim() || null,
    });

    await supabase
      .from("bookings")
      .update({ room_id: selectedRoom })
      .eq("id", bookingId);

    await Promise.all([
      supabase
        .from("rooms")
        .update({ status: "dirty" })
        .eq("id", booking.room_id),
      supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", selectedRoom),
    ]);

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="rounded-t-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.06-7.666a.75.75 0 01.744.648l.007.102v2.033l-.312-.311a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H11.48a.75.75 0 100 1.5h3.634a.75.75 0 00.75-.75V4.358a.75.75 0 00-.75-.75h-.001z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">{t("changeRoomTitle")}</h3>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
              <p className="text-sm text-gray-500">{t("loading")}</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-8">
              <BedIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">{t("noAvailableRooms")}</p>
              <button
                onClick={onClose}
                className="mt-4 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("selectNewRoom")}
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">{t("selectRoomPlaceholder")}</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} - {r.floors?.name} - {r.room_categories?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("changeRoomReason")}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder={t("changeRoomReasonPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedRoom}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-200 disabled:opacity-50"
                >
                  {saving ? t("processing") : t("changeRoomTitle")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
