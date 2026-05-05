"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  carritoApi,
  formatCurrency,
  getProductImage,
  type CarritoItem,
} from "../../lib/api";
import { dispatchCartUpdated, useCart } from "../hooks/useCart";

export default function Carrito() {
  const [checkout, setCheckout] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const {
    loading,
    error,
    isAuthenticated,
    backendCart,
    guestAsBackendLikeItems,
    guestTotal,
    updateGuestQuantity,
    removeGuestItem,
    clearCart,
    reload,
  } = useCart();

  const actualizarCantidad = async (item: CarritoItem, cantidad: number) => {
    if (cantidad <= 0) {
      return;
    }

    try {
      setUpdatingId(item.DOV_DET_ORDEN_VENTA);
      if (isAuthenticated && item.DOV_DET_ORDEN_VENTA > 0) {
        await carritoApi.actualizarItem(item.DOV_DET_ORDEN_VENTA, {
          DOV_Cantidad: cantidad,
          DOV_Descuento: item.DOV_DESCUENTO,
        });
        dispatchCartUpdated();
        await reload();
      } else {
        updateGuestQuantity(item.PRO_PRODUCTO, cantidad);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const eliminarItem = async (item: CarritoItem) => {
    setUpdatingId(item.DOV_DET_ORDEN_VENTA);

    try {
      if (isAuthenticated && item.DOV_DET_ORDEN_VENTA > 0) {
        await carritoApi.eliminarItem(item.DOV_DET_ORDEN_VENTA);
        dispatchCartUpdated();
        await reload();
      } else {
        removeGuestItem(item.PRO_PRODUCTO);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const vaciarCarrito = async () => {
    setUpdatingId(0);

    try {
      await clearCart();
      setCheckout(false);
    } finally {
      setUpdatingId(null);
    }
  };

  const items = isAuthenticated ? backendCart?.items ?? [] : guestAsBackendLikeItems;
  const total = isAuthenticated ? Number(backendCart?.orden.ODV_TOTAL ?? 0) : guestTotal;
  const isEmpty = items.length === 0;

  return (
    <main className="bg-white text-black">

      {/* CONTENIDO */}
      <section className="px-6 md:px-10 py-10 max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Carrito de compras
        </h1>

        {loading && (
          <div className="space-y-6">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center gap-6 border p-4 rounded-lg animate-pulse"
              >
                <div className="w-full md:w-[150px] h-[120px] bg-gray-200 rounded" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-4 bg-gray-200 w-1/2" />
                  <div className="h-4 bg-gray-200 w-1/3" />
                </div>
                <div className="h-5 bg-gray-200 w-24" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 border border-red-300 px-4 py-2 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div className="border p-8 text-center">
            <p className="text-gray-500">Tu carrito esta vacio.</p>
            <Link
              href="/shop/tienda"
              className="mt-6 inline-block bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              IR A TIENDA
            </Link>
          </div>
        )}

        {!loading && !error && !isEmpty && (
          <>
            {/* LISTADO */}
            <div className="space-y-6">

              {items.map((item) => (
                <div
                  key={item.DOV_DET_ORDEN_VENTA}
                  className="flex flex-col md:flex-row items-center gap-6 border p-4 rounded-lg"
                >
                  <div className="relative w-full md:w-[150px] h-[120px]">
                    <Image
                      unoptimized
                      src={getProductImage(item.PRO_PRODUCTO)}
                      alt={item.PRO_NOMBRE ?? "Producto"}
                      fill
                      className="object-cover rounded"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">{item.PRO_NOMBRE}</p>
                    <p className="text-sm text-gray-500">
                      Precio unitario: {formatCurrency(item.DOV_PRECIO_UNITARIO)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void actualizarCantidad(item, item.DOV_CANTIDAD - 1)
                        }
                        disabled={item.DOV_CANTIDAD <= 1 || updatingId !== null}
                        className="h-9 w-9 border text-lg disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm">
                        {item.DOV_CANTIDAD}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void actualizarCantidad(item, item.DOV_CANTIDAD + 1)
                        }
                        disabled={updatingId !== null}
                        className="h-9 w-9 border text-lg disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="font-semibold">
                      {formatCurrency(item.DOV_SUBTOTAL)}
                    </div>
                    <button
                      type="button"
                      onClick={() => void eliminarItem(item)}
                      disabled={updatingId !== null}
                      className="text-sm text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

            </div>

            {/* TOTAL */}
            <div className="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-6">

              <p className="text-xl font-bold">
                Total: {formatCurrency(total)}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">

                <Link
                  href="/shop/tienda"
                  className="border px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition text-center"
                >
                  CONTINUAR COMPRA
                </Link>

                <button
                  type="button"
                  onClick={() => void vaciarCarrito()}
                  disabled={updatingId !== null}
                  className="border px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  VACIAR
                </button>

                <button
                  type="button"
                  onClick={() => setCheckout(true)}
                  className="bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
                >
                  EFECTUAR COMPRA
                </button>

              </div>

            </div>
          </>
        )}

      </section>

      {/* CHECKOUT */}
      {checkout && !isEmpty && (
        <section className="px-6 md:px-10 pb-10 max-w-7xl mx-auto">

          <h2 className="text-2xl font-bold mb-6">
            Resumen de compra
          </h2>

          <div className="space-y-4">

            {items.map((item) => (
              <div
                key={item.DOV_DET_ORDEN_VENTA}
                className="flex justify-between border-b pb-2"
              >
                <p>
                  {item.PRO_NOMBRE} x{item.DOV_CANTIDAD}
                </p>
                <p>
                  {formatCurrency(item.DOV_SUBTOTAL)}
                </p>
              </div>
            ))}

          </div>

          <div className="mt-6 text-right">
            <p className="text-xl font-bold mb-4">
              Total: {formatCurrency(total)}
            </p>

            <Link
              href={isAuthenticated ? "/shop/pago" : "/shop/login"}
              className="bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              {isAuthenticated ? "PAGAR" : "INICIAR SESION PARA PAGAR"}
            </Link>
          </div>

        </section>
      )}

    </main>
  );
}
