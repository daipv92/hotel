"use client";

import { createContext, useContext } from "react";

type HotelContextType = {
  hotelId: string;
  hotelName: string;
};

const HotelContext = createContext<HotelContextType | null>(null);

export function HotelProvider({
  hotelId,
  hotelName,
  children,
}: HotelContextType & { children: React.ReactNode }) {
  return (
    <HotelContext.Provider value={{ hotelId, hotelName }}>
      {children}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error("useHotel must be used within HotelProvider");
  }
  return context;
}
