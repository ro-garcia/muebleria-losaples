"use client";

import Image from "next/image";
import Link from "next/link";

export default function Categorias() {
  const categorias = [
    {
      name: "Living",
      img: "https://images.unsplash.com/photo-1567016432779-094069958ea5",
      link: "/shop/categorias/living",
    },
    {
      name: "Dormitorio",
      img: "https://images.unsplash.com/photo-1505693314120-0d443867891c",
      link: "/shop/categorias/dormitorio",
    },
    {
      name: "Oficina",
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
      link: "/shop/categorias/oficina",
    },
    {
      name: "Comedor",
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      link: "/shop/categorias/comedor",
    },
    {
      name: "Exterior",
      img: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6",
      link: "/shop/categorias/exterior",
    },
    {
      name: "Decoración",
      img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4",
      link: "/shop/categorias/decoracion",
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {categorias.map((cat, i) => (
            <Link key={i} href={cat.link} className="group block">
              <div className="relative h-[300px] overflow-hidden rounded-xl">
                <Image
                  unoptimized
                  src={cat.img}
                  alt={cat.name}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />

                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />

                <div className="absolute bottom-4 left-4">
                  <p className="text-white text-xl font-semibold tracking-wide">
                    {cat.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </section>

    </main>
  );
}