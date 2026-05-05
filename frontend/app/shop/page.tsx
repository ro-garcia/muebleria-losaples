"use client";

import Image from "next/image";
import Link from "next/link";
import { Truck, CreditCard, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  categoriasApi,
  formatCurrency,
  getCategoryImage,
  getProductImage,
  type Categoria,
  type Producto,
  productosApi,
} from "../lib/api";

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    let active = true;

    const cargarCategorias = async () => {
      try {
        const data = await categoriasApi.listar();

        if (active) {
          setCategorias(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setCategorias([]);
        }
      } finally {
        if (active) {
          setLoadingCategorias(false);
        }
      }
    };

    const cargarProductos = async () => {
      try {
        const data = await productosApi.listar();

        if (active) {
          setProductos(data.slice(0, 4));
        }
      } catch {
        if (active) {
          setProductos([]);
        }
      } finally {
        if (active) {
          setLoadingProductos(false);
        }
      }
    };

    void cargarCategorias();
    void cargarProductos();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="bg-white text-black">

      {/* HERO */}
      <section className="relative w-full h-[90vh]">
        <Image
          unoptimized
          src="https://images.unsplash.com/photo-1567016432779-094069958ea5"
          alt="hero"
          fill
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 md:px-20 text-white">
          <h2 className="text-4xl md:text-6xl font-bold max-w-xl">
            Muebles que transforman tu hogar
          </h2>

          <p className="mt-4 text-lg max-w-md">
            Diseno moderno, calidad premium y confort en cada espacio
          </p>

          <Link
            href="/shop/tienda"
            className="mt-6 w-fit bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-gray-200 transition"
          >
            VER COLECCION
          </Link>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-16 px-6 md:px-10 border-b">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center border border-black rounded-full mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <p className="font-semibold">Envios a todo el pais</p>
            <p className="text-sm text-gray-500 mt-1">
              Entrega rapida y segura
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center border border-black rounded-full mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="font-semibold">Pagos seguros</p>
            <p className="text-sm text-gray-500 mt-1">
              Tarjetas y transferencia
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center border border-black rounded-full mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="font-semibold">Garantia de calidad</p>
            <p className="text-sm text-gray-500 mt-1">
              Materiales premium
            </p>
          </div>

        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="py-14 px-6 md:px-10">
        <h2 className="text-2xl font-bold mb-8">Categorias</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingCategorias &&
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-[300px] animate-pulse rounded-xl bg-gray-200"
              />
            ))}

          {!loadingCategorias && categorias.length === 0 && (
            <div className="md:col-span-3 border p-8 text-center text-gray-500">
              No hay categorias disponibles en este momento.
            </div>
          )}

          {!loadingCategorias &&
            categorias.map((cat, index) => (
              <Link
                key={cat.TIP_TIPO_PRODUCTO}
                href={`/shop/tienda?categoriaId=${cat.TIP_TIPO_PRODUCTO}`}
                className="relative h-[300px] overflow-hidden group cursor-pointer"
              >
                <Image
                  unoptimized
                  src={getCategoryImage(cat.TIP_TIPO_PRODUCTO, index)}
                  alt={cat.TIP_NOMBRE}
                  fill
                  sizes="33vw"
                  className="object-cover group-hover:scale-105 transition"
                />

                <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                  <p className="text-white text-lg font-semibold">
                    {cat.TIP_NOMBRE}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="px-6 md:px-10 pb-14">
        <h2 className="text-2xl font-bold mb-8">Mas vendidos</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loadingProductos &&
            Array.from({ length: 4 }, (_, item) => (
              <div key={item} className="animate-pulse">
                <div className="h-[250px] bg-gray-200" />
                <div className="h-4 bg-gray-200 mt-3 w-2/3" />
                <div className="h-4 bg-gray-200 mt-2 w-1/3" />
              </div>
            ))}

          {!loadingProductos && productos.length === 0 && (
            <div className="col-span-2 md:col-span-4 border p-8 text-center text-gray-500">
              No hay productos disponibles por el momento.
            </div>
          )}

          {!loadingProductos &&
            productos.map((item) => (
              <Link
                href={`/shop/producto/${item.PRO_PRODUCTO ?? item.PRO_Producto}`}
                key={item.PRO_PRODUCTO ?? item.PRO_Producto}
                className="group"
              >
                <div className="relative h-[250px] overflow-hidden">
                  <Image
                    unoptimized
                    src={getProductImage(item.PRO_PRODUCTO)}
                    alt={item.PRO_NOMBRE ?? item.PRO_Nombre ?? "Producto"}
                    fill
                    sizes="25vw"
                    className="object-cover group-hover:scale-105 transition"
                  />
                </div>

                <div className="mt-2">
                  <p className="text-sm">{item.PRO_NOMBRE}</p>
                  <p className="font-semibold">
                    {formatCurrency(item.PRE_PRECIO)}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* BANNER */}
      <section className="relative h-[300px]">
        <Image
          unoptimized
          src="https://images.unsplash.com/photo-1615874959474-d609969a20ed"
          alt="banner"
          fill
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <p className="text-white text-xl font-bold">
            Ofertas especiales esta semana
          </p>
        </div>
      </section>

    </main>
  );
}
