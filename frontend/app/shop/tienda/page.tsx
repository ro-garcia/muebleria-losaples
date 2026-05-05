"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  categoriasApi,
  formatCurrency,
  getApiErrorMessage,
  getProductImage,
  productosApi,
  type Categoria,
  type Producto,
} from "../../lib/api";

function TiendaContent() {
  const searchParams = useSearchParams();
  const categoriaIdParam = searchParams.get("categoriaId");

  const [categoriaId, setCategoriaId] = useState<string>(
    categoriaIdParam ?? "",
  );
  const [precio, setPrecio] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarProductos = useCallback(async (catId?: number) => {
    setLoading(true);
    setError("");

    try {
      const data = await productosApi.listar(catId);
      setProductos(Array.isArray(data) ? data : []);
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    categoriasApi
      .listar()
      .then((data) => {
        if (Array.isArray(data)) setCategorias(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = categoriaId !== "" ? Number(categoriaId) : undefined;
    void cargarProductos(id);
  }, [categoriaId, cargarProductos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const precioActual = Number(producto.PRE_PRECIO ?? 0);
      return (
        precio === "" ||
        (precio === "low" && precioActual < 1000) ||
        (precio === "mid" && precioActual >= 1000 && precioActual <= 2000) ||
        (precio === "high" && precioActual > 2000)
      );
    });
  }, [precio, productos]);

  return (
    <main className="bg-white text-black">

      {/* HEADER */}
      <section className="px-6 md:px-10 py-10 border-b">
        <h1 className="text-3xl font-bold">Todos los productos</h1>
        <p className="text-gray-500 mt-2">
          Explora nuestra coleccion completa
        </p>
      </section>

      {/* CONTENIDO */}
      <section className="px-6 md:px-10 py-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* FILTROS */}
        <div className="space-y-8">

          <div>
            <p className="font-semibold mb-3">Categoria</p>
            <select
              className="w-full border p-2"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option
                  key={cat.TIP_TIPO_PRODUCTO}
                  value={String(cat.TIP_TIPO_PRODUCTO)}
                >
                  {cat.TIP_NOMBRE}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-semibold mb-3">Precio</p>
            <select
              className="w-full border p-2"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="low">Menor a Q1,000</option>
              <option value="mid">Q1,000 - Q2,000</option>
              <option value="high">Mayor a Q2,000</option>
            </select>
          </div>

        </div>

        {/* PRODUCTOS */}
        <div className="md:col-span-3">
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-[250px] rounded-lg bg-gray-200" />
                  <div className="h-4 bg-gray-200 mt-3 w-2/3" />
                  <div className="h-4 bg-gray-200 mt-2 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  const id =
                    categoriaId !== "" ? Number(categoriaId) : undefined;
                  void cargarProductos(id);
                }}
                className="mt-4 border border-red-300 px-4 py-2 font-semibold hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && productosFiltrados.length === 0 && (
            <div className="border p-8 text-center text-gray-500">
              No hay productos disponibles con los filtros seleccionados.
            </div>
          )}

          {!loading && !error && productosFiltrados.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {productosFiltrados.map((p) => (
                <Link
                  key={p.PRO_PRODUCTO ?? p.PRO_Producto}
                  href={`/shop/producto/${p.PRO_PRODUCTO ?? p.PRO_Producto}`}
                  className="group block"
                >
                  <div className="relative h-[250px] overflow-hidden rounded-lg">
                    <Image
                      unoptimized
                      src={getProductImage(p.PRO_PRODUCTO)}
                      alt={p.PRO_NOMBRE ?? p.PRO_Nombre ?? "Producto"}
                      fill
                      sizes="33vw"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="mt-2">
                    <p className="text-sm">{p.PRO_NOMBRE}</p>
                    {p.TIP_NOMBRE && (
                      <p className="text-xs text-gray-400">{p.TIP_NOMBRE}</p>
                    )}
                    <p className="font-semibold">
                      {formatCurrency(p.PRE_PRECIO)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </section>

    </main>
  );
}

export default function Tienda() {
  return (
    <Suspense
      fallback={
        <main className="bg-white text-black">
          <section className="px-6 md:px-10 py-10 border-b">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
          </section>
          <section className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-[250px] rounded-lg bg-gray-200" />
                  <div className="h-4 bg-gray-200 mt-3 w-2/3" />
                </div>
              ))}
            </div>
          </section>
        </main>
      }
    >
      <TiendaContent />
    </Suspense>
  );
}
