"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 w-full bg-white z-[999] border-b shadow-sm text-black">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LOGO */}
        <h1
          onClick={() => router.push("/shop")}
          className="text-xl font-bold tracking-wide cursor-pointer text-black"
        >
          LOS ALPES
        </h1>

        {/* MENU */}
        <nav className="hidden md:flex gap-10 text-sm font-medium text-black">
          <Link className="hover:text-gray-600 transition" href="/shop">Inicio</Link>
          <Link className="hover:text-gray-600 transition" href="/shop/tienda">Tienda</Link>
          <Link className="hover:text-gray-600 transition" href="/shop/categorias">Categorías</Link>
          <Link className="hover:text-gray-600 transition" href="/shop/contacto">Contacto</Link>
        </nav>

        {/* ICONOS */}
        <div className="flex items-center gap-6 text-black">

          {/* USUARIO */}
          <User
            onClick={() => router.push("/shop/login")}
            className="w-5 h-5 cursor-pointer text-black hover:opacity-70 transition"
          />

          {/* CARRITO */}
          <ShoppingCart
            onClick={() => router.push("/shop/carrito")}
            className="w-5 h-5 cursor-pointer text-black hover:opacity-70 transition"
          />

          {/* MOBILE */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-black"
          >
            {open ? <X /> : <Menu />}
          </button>

        </div>

      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden flex flex-col items-center gap-4 py-6 border-t bg-white text-black">

          <Link
            className="hover:text-gray-600"
            href="/shop"
            onClick={() => setOpen(false)}
          >
            Inicio
          </Link>

          <Link
            className="hover:text-gray-600"
            href="/shop/tienda"
            onClick={() => setOpen(false)}
          >
            Tienda
          </Link>

          <Link
            className="hover:text-gray-600"
            href="/shop/categorias"
            onClick={() => setOpen(false)}
          >
            Categorías
          </Link>

          <Link
            className="hover:text-gray-600"
            href="/shop/contacto"
            onClick={() => setOpen(false)}
          >
            Contacto
          </Link>

        </div>
      )}

    </header>
  );
}