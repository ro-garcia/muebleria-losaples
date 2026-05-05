"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  formatCurrency,
  getApiErrorMessage,
  getProductImage,
  type Producto,
  productosApi,
} from "../../../lib/api";
import { useCart } from "../../hooks/useCart";

export default function ProductoDetalle() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productoId = Number(params.id);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { addProduct } = useCart();

  const cargarProducto = useCallback(async () => {
    if (!Number.isFinite(productoId) || productoId <= 0) {
      setError("Producto invalido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await productosApi.obtener(productoId);
      setProducto(data);
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    void cargarProducto();
  }, [cargarProducto]);

  const agregarAlCarrito = async () => {
    if (!producto) {
      return;
    }

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      await addProduct({
        productId: producto.PRO_PRODUCTO,
        codigo: producto.PRO_CODIGO,
        nombre: producto.PRO_NOMBRE,
        precioUnitario: Number(producto.PRE_PRECIO ?? 0),
        cantidad,
      });
      setSuccess("Producto agregado al carrito.");
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

        {loading && (
          <>
            <div className="h-[400px] w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="space-y-5 animate-pulse">
              <div className="h-8 w-2/3 bg-gray-200" />
              <div className="h-4 w-full bg-gray-200" />
              <div className="h-4 w-5/6 bg-gray-200" />
              <div className="h-8 w-32 bg-gray-200" />
            </div>
          </>
        )}

        {!loading && error && !producto && (
          <div className="md:col-span-2 border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void cargarProducto()}
              className="mt-4 border border-red-300 px-4 py-2 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && producto && (
          <>
            {/* IMAGEN */}
            <div className="relative h-[400px] w-full">
              <Image
                unoptimized
                src={getProductImage(producto.PRO_PRODUCTO)}
                alt={producto.PRO_NOMBRE ?? producto.PRO_Nombre ?? "Producto"}
                fill
                className="object-cover rounded-xl"
              />
            </div>

            {/* INFO */}
            <div className="space-y-6">

              <h1 className="text-3xl font-bold">
                {producto.PRO_NOMBRE}
              </h1>

              <p className="text-gray-500">
                Mueble disponible en la coleccion actual de Los Alpes.
              </p>

              <div className="space-y-2 text-sm">
                <p><strong>Referencia:</strong> {producto.PRO_CODIGO ?? producto.PRO_PRODUCTO}</p>
                <p><strong>Estado:</strong> {producto.PRO_ESTADO ?? "ACTIVO"}</p>
              </div>

              <p className="text-2xl font-bold">
                {formatCurrency(producto.PRE_PRECIO)}
              </p>

              {error && (
                <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* BOTONES */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium" htmlFor="cantidad">
                  Cantidad
                </label>
                <input
                  id="cantidad"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(event) => setCantidad(Number(event.target.value))}
                  className="w-full max-w-[160px] border p-3"
                />

                <button
                  type="button"
                  onClick={() => void agregarAlCarrito()}
                  disabled={adding || !producto.PRE_PRECIO}
                  className="bg-black text-white py-3 font-semibold hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {adding ? "AGREGANDO..." : "AGREGAR AL CARRITO"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/shop/carrito")}
                  className="border py-3 font-semibold hover:bg-gray-100 transition"
                >
                  VER CARRITO
                </button>

              </div>

            </div>
          </>
        )}

      </section>

    </main>
  );
}
