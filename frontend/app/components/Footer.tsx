import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* MARCA */}
        <div>
          <h2 className="text-2xl font-bold mb-4">LOS ALPES</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Muebles modernos diseñados para transformar tu hogar
            con estilo y confort.
          </p>
        </div>

        {/* TIENDA */}
        <div>
          <p className="font-semibold mb-4">Tienda</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/shop/tienda">Productos</Link></li>
            <li><Link href="/shop/categorias">Categorías</Link></li>
          </ul>
        </div>

        {/* SOPORTE */}
        <div>
          <p className="font-semibold mb-4">Soporte</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/shop/contacto">Contacto</Link></li>
            <li><Link href="#">Envíos</Link></li>
            <li><Link href="#">Políticas</Link></li>
          </ul>
        </div>

        {/* CONTACTO */}
        <div>
          <p className="font-semibold mb-4">Contacto</p>
          <p className="text-sm text-gray-400">
            Guatemala<br />
            info@losalpes.com<br />
            +502 1234-5678
          </p>
        </div>

      </div>

      <div className="border-t border-gray-800 text-center py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Los Alpes — Todos los derechos reservados
      </div>

    </footer>
  );
}