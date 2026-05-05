"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  carritoApi,
  DEFAULT_TIENDA_ID,
  type Carrito,
  type CarritoItem,
} from "../../lib/api";
import { useSession } from "./useSession";

const CART_STORAGE_KEY = "shop_cart_guest";
const CART_EVENT = "shop-cart-updated";

export const dispatchCartUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
};

export interface GuestCartItem {
  productId: number;
  codigo?: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  dispatchCartUpdated();
};

const clearGuestCart = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
  dispatchCartUpdated();
};

export const useCart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendCart, setBackendCart] = useState<Carrito | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);

  const { user: sessionUser } = useSession();
  const clienteId = sessionUser?.clienteId ?? null;
  const isAuthenticated = Boolean(clienteId);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isAuthenticated && clienteId) {
        const data = await carritoApi.obtenerPorCliente(clienteId);
        setBackendCart(data);
        setGuestItems([]);
      } else {
        setBackendCart(null);
        setGuestItems(readGuestCart());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, [clienteId, isAuthenticated]);

  const mergeGuestIntoBackend = useCallback(async () => {
    if (!isAuthenticated || !clienteId) return;
    const guest = readGuestCart();
    if (guest.length === 0) return;

    for (const item of guest) {
      await carritoApi.agregarItemActivo({
        CLI_Cliente: clienteId,
        TIE_Tienda: DEFAULT_TIENDA_ID,
        PRO_Producto: item.productId,
        DOV_Cantidad: item.cantidad,
      });
    }

    clearGuestCart();
  }, [clienteId, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      void reload();
    };
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, [reload]);

  useEffect(() => {
    void (async () => {
      if (isAuthenticated) {
        await mergeGuestIntoBackend();
      }
      await reload();
    })();
  }, [isAuthenticated, mergeGuestIntoBackend, reload]);

  const addProduct = useCallback(
    async (product: {
      productId: number;
      codigo?: string | null;
      nombre: string;
      precioUnitario: number;
      cantidad: number;
    }) => {
      setError("");
      if (isAuthenticated && clienteId) {
        await carritoApi.agregarItemActivo({
          CLI_Cliente: clienteId,
          TIE_Tienda: DEFAULT_TIENDA_ID,
          PRO_Producto: product.productId,
          DOV_Cantidad: product.cantidad,
        });
        dispatchCartUpdated();
        return;
      }

      const items = readGuestCart();
      const existing = items.find((item) => item.productId === product.productId);
      if (existing) {
        existing.cantidad += product.cantidad;
      } else {
        items.push({
          productId: product.productId,
          codigo: product.codigo ?? null,
          nombre: product.nombre,
          precioUnitario: product.precioUnitario,
          cantidad: product.cantidad,
        });
      }
      writeGuestCart(items);
      setGuestItems(items);
    },
    [clienteId, isAuthenticated],
  );

  const removeGuestItem = useCallback((productId: number) => {
    const items = readGuestCart().filter((item) => item.productId !== productId);
    writeGuestCart(items);
    setGuestItems(items);
  }, []);

  const updateGuestQuantity = useCallback((productId: number, cantidad: number) => {
    const items = readGuestCart().map((item) =>
      item.productId === productId ? { ...item, cantidad } : item,
    );
    writeGuestCart(items);
    setGuestItems(items);
  }, []);

  const clearCart = useCallback(async () => {
    if (isAuthenticated && backendCart?.orden.ODV_ORDEN_VENTA) {
      const data = await carritoApi.vaciar(backendCart.orden.ODV_ORDEN_VENTA);
      setBackendCart(data);
      dispatchCartUpdated();
      return;
    }
    clearGuestCart();
    setGuestItems([]);
  }, [backendCart?.orden.ODV_ORDEN_VENTA, isAuthenticated]);

  const itemCount = useMemo(() => {
    if (isAuthenticated) {
      return (backendCart?.items ?? []).reduce(
        (acc, item) => acc + Number(item.DOV_CANTIDAD ?? 0),
        0,
      );
    }
    return guestItems.reduce((acc, item) => acc + Number(item.cantidad ?? 0), 0);
  }, [backendCart?.items, guestItems, isAuthenticated]);

  const guestAsBackendLikeItems = useMemo(
    () =>
      guestItems.map((item, index): CarritoItem => {
        const subtotal = item.cantidad * item.precioUnitario;
        return {
          DOV_DET_ORDEN_VENTA: -(index + 1),
          ODV_ORDEN_VENTA: 0,
          PRO_PRODUCTO: item.productId,
          PRO_CODIGO: item.codigo ?? null,
          PRO_NOMBRE: item.nombre,
          DOV_CANTIDAD: item.cantidad,
          DOV_PRECIO_UNITARIO: item.precioUnitario,
          DOV_DESCUENTO: 0,
          DOV_SUBTOTAL: subtotal,
        };
      }),
    [guestItems],
  );

  const guestTotal = useMemo(
    () => guestItems.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0),
    [guestItems],
  );

  return {
    loading,
    error,
    isAuthenticated,
    clienteId,
    backendCart,
    guestItems,
    guestAsBackendLikeItems,
    guestTotal,
    itemCount,
    addProduct,
    removeGuestItem,
    updateGuestQuantity,
    clearCart,
    reload,
  };
};
