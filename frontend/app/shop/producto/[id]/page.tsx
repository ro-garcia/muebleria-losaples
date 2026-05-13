import { notFound } from "next/navigation";

import { productosApi, type Producto } from "../../../lib/api";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamicParams = false;

const fallbackProductIds = (process.env.NEXT_PUBLIC_STATIC_PRODUCT_IDS ?? "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((id) => Number.isInteger(id) && id > 0);

interface ProductoDetallePageProps {
  params: Promise<{
    id: string;
  }>;
}

const readProductoId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function generateStaticParams() {
  try {
    const productos = await productosApi.listar();
    const ids = productos
      .map((producto) => producto.PRO_PRODUCTO)
      .filter((id): id is number => Number.isInteger(id) && id > 0);

    if (ids.length > 0) {
      return ids.map((id) => ({ id: String(id) }));
    }

    return fallbackProductIds.map((id) => ({ id: String(id) }));
  } catch (error) {
    console.warn(
      "No se pudieron generar rutas estaticas de productos.",
      error,
    );

    return fallbackProductIds.map((id) => ({ id: String(id) }));
  }
}

export default async function ProductoDetallePage({
  params,
}: ProductoDetallePageProps) {
  const { id: rawId } = await params;
  const productoId = readProductoId(rawId);

  if (!productoId) {
    notFound();
  }

  let productoInicial: Producto | null = null;

  try {
    productoInicial = await productosApi.obtener(productoId);
  } catch (error) {
    console.warn(`Producto ${productoId} se cargara desde el cliente.`, error);
  }

  return (
    <ProductDetailClient
      productoId={productoId}
      productoInicial={productoInicial}
    />
  );
}
