# QA manual - shop/carrito/checkout

## Validaciones ejecutadas

1. Build backend (`backend`): OK.
2. Lint frontend (`frontend`): OK.
3. Smoke API `GET /shop/auth/me` sin token: `401` esperado.
4. Smoke API `GET /shop/checkout/orders` sin token: `401` esperado.
5. Smoke API `POST /shop/auth/register` con backend ya corriendo:
   - Respondio con validacion de esquema actual `MUE_USUARIO.PER_Persona`.
   - Nota: este resultado usa proceso backend previo; reiniciar backend para cargar la nueva logica con fallback a `MUE_PERSONA`.

## Flujo manual pendiente (despues de reiniciar backend)

1. Registro cliente en `/shop/login` (modo crear cuenta):
   - Verificar creacion en `MUE_CLIENTE`.
   - Verificar credenciales en `MUE_USUARIO` (y `MUE_PERSONA` si aplica).
2. Login cliente:
   - Confirmar sesion persistida (`shop_token`, `shop_user`).
3. Carrito anonimo:
   - Agregar productos desde `/shop/producto/[id]`.
   - Ver contador en navbar y persistencia al recargar.
4. Fusion al iniciar sesion:
   - Tener carrito anonimo y luego login.
   - Confirmar que items pasan a carrito backend del cliente.
5. Checkout en `/shop/pago`:
   - Confirmar creacion transaccional de:
     - `MUE_ORDENVENTA` (estado `FINALIZADO`)
     - `MUE_DETORDENVENTA`
     - `MUE_FACTURA` (estado `PAGADA`)
     - `MUE_DETALLE_FACTURA`
6. Confirmacion:
   - Revisar `/shop/checkout?orden=...&factura=...`.
   - Validar total, detalle y datos de factura.
7. Historial cliente:
   - Revisar `/shop/cuenta` en tab pedidos.
8. Admin clientes:
   - Revisar tab `Clientes` en admin:
     - listado
     - detalle cliente
     - historial de compras
     - password enmascarada.
9. Correo:
   - Si SMTP configurado, validar envio.
   - Si falla SMTP, compra debe quedar confirmada con advertencia.
