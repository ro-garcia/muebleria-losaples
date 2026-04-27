"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function Tienda() {
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");

  const productos = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, // importante que no sea 0
    nombre: "Sillón moderno",
    precio: "Q1,200",
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  }));

  return (
    <main className="bg-white text-black">

      {/* HEADER */}
      <section className="px-6 md:px-10 py-10 border-b">
        <h1 className="text-3xl font-bold">Todos los productos</h1>
        <p className="text-gray-500 mt-2">
          Explora nuestra colección completa
        </p>
      </section>

      {/* CONTENIDO */}
      <section className="px-6 md:px-10 py-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* FILTROS */}
        <div className="space-y-8">

          <div>
            <p className="font-semibold mb-3">Categoría</p>
            <select
              className="w-full border p-2"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="living">Living</option>
              <option value="dormitorio">Dormitorio</option>
              <option value="oficina">Oficina</option>
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
        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6">

          {productos.map((p) => (
            <Link
              key={p.id}
              href={`/shop/producto/${p.id}`}
              className="group block"
            >
              <div className="relative h-[250px] overflow-hidden rounded-lg">
                <Image
                  unoptimized
                  src={p.img}
                  alt={p.nombre}
                  fill
                  sizes="33vw"
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="mt-2">
                <p className="text-sm">{p.nombre}</p>
                <p className="font-semibold">{p.precio}</p>
              </div>
            </Link>
          ))}

        </div>

      </section>

    </main>
  );
}