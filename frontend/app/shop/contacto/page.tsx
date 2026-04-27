"use client";

import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contacto() {
  return (
    <main className="bg-white text-black">

      {/* HERO */}
      <section className="relative h-[300px] w-full">
        <Image
          unoptimized
          src="https://images.unsplash.com/photo-1493666438817-866a91353ca9"
          alt="contacto"
          fill
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Contáctanos
          </h1>
          <p className="text-sm md:text-base mt-2 text-gray-200 max-w-md">
            Estamos disponibles para ayudarte en todo momento
          </p>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* INFO */}
        <div className="space-y-10">

          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 mt-1" />
            <div>
              <p className="font-semibold">Correo</p>
              <p className="text-gray-500">info@losalpes.com</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 mt-1" />
            <div>
              <p className="font-semibold">Teléfono</p>
              <p className="text-gray-500">+502 1234-5678</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 mt-1" />
            <div>
              <p className="font-semibold">Ubicación</p>
              <p className="text-gray-500">Ciudad de Guatemala</p>
            </div>
          </div>

        </div>

        {/* FORM */}
        <div className="border p-8 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            Envíanos un mensaje
          </h2>

          <form className="space-y-6">

            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                className="w-full border border-gray-300 mt-2 p-3 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Correo</label>
              <input
                type="email"
                className="w-full border border-gray-300 mt-2 p-3 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <textarea
                rows={5}
                className="w-full border border-gray-300 mt-2 p-3 focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              ENVIAR MENSAJE
            </button>

          </form>
        </div>

      </section>

      {/* MAPA */}
      <section className="h-[400px] w-full">
        <iframe
          src="https://maps.google.com/maps?q=guatemala&t=&z=13&ie=UTF8&iwloc=&output=embed"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </section>

    </main>
  );
}