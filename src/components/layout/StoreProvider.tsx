"use client";

import { createContext, useContext } from "react";

type StoreIdentity = {
  storeName: string;
  outletName: string;
};

const StoreContext = createContext<StoreIdentity>({ storeName: "SimplePOS", outletName: "" });

/**
 * Identitas toko diambil sekali di layout (server) lalu dibagikan ke seluruh halaman,
 * sehingga sekali nama diubah semua tampilan ikut berubah tanpa fetch tambahan.
 */
export function StoreProvider({
  value,
  children,
}: {
  value: StoreIdentity;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreIdentity {
  return useContext(StoreContext);
}
