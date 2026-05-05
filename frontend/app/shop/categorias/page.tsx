"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { categoriasApi, getCategoryImage, type Categoria } from "../../lib/api";

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await categoriasApi.listar();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <main className="bg-white text-black">

      {/* HERO */}
      <section className="relative h-[300px] w-full">
        <Image
          unoptimized
          src="https://images.unsplash.com/photo-1618220179428-22790b461013"
          alt="categorias"
          fill
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Categorías
          </h1>
          <p className="text-sm md:text-base mt-2 text-gray-200 max-w-md">
            Explora nuestros muebles por espacios
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {!loading && categorias.length === 0 && (
          <div className="border p-8 text-center text-gray-500">
            No hay categorías disponibles.
          </div>
        )}

        {!loading && categorias.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categorias.map((cat, i) => (
              <Link
                key={cat.TIP_TIPO_PRODUCTO}
                href={`/shop/tienda?categoriaId=${cat.TIP_TIPO_PRODUCTO}`}
                className="group block"
              >
                <div className="relative h-[300px] overflow-hidden rounded-xl">
                  <Image
                    unoptimized
                    src={getCategoryImage(cat.TIP_TIPO_PRODUCTO, i)}
                    alt={cat.TIP_NOMBRE}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />

                  <div className="absolute bottom-4 left-4">
                    <p className="text-white text-xl font-semibold tracking-wide">
                      {cat.TIP_NOMBRE}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>

    </main>
  );
}
