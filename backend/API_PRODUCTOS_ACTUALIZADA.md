# API de Productos - Documentación Actualizada

## Cambios Realizados

La API de productos ha sido refactorizada para representar correctamente el modelo relacional de la base de datos, permitiendo:

1. ✅ **Estructura normalizada de BD** - No duplica campos
2. ✅ **Gestión completa de productos** - Incluye detalles, material, color, tipo y precio
3. ✅ **Transacciones atómicas** - Con commit/rollback automático
4. ✅ **Respuestas consistentes** - Frontend recibe objeto completo

---

## Endpoints

### 1. **Listar Productos** (Solo activos)
```http
GET /api/productos
GET /api/productos?categoria=2
GET /api/productos?todos=true
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "PRO_Producto": 1,
      "PRO_Codigo": "MUE-001",
      "PRO_Nombre": "Silla de Escritorio",
      "PRO_Estado": "ACTIVO",
      "DEP_Detalle_Producto": 10,
      "TIP_Tipo_Producto": 2,
      "TIP_Nombre": "Sillas",
      "MAP_Material": 5,
      "COP_Color_Producto": 3,
      "DEP_Peso": 4.5,
      "DEP_Longitud": 0.8,
      "PRE_Precio": 150000
    }
  ]
}
```

---

### 2. **Obtener Producto por ID**
```http
GET /api/productos/:id
```

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "PRO_Producto": 1,
    "PRO_Codigo": "MUE-001",
    "PRO_Nombre": "Silla de Escritorio",
    "PRO_Estado": "ACTIVO",
    "DEP_Detalle_Producto": 10,
    "TIP_Tipo_Producto": 2,
    "TIP_Nombre": "Sillas",
    "MAP_Material": 5,
    "COP_Color_Producto": 3,
    "DEP_Peso": 4.5,
    "DEP_Longitud": 0.8,
    "PRE_Precio": 150000
  }
}
```

---

### 3. **Crear Producto** ✨ ACTUALIZADO

```http
POST /api/productos
Content-Type: application/json
```

**Request Body (Todos los campos opcionales excepto PRO_Codigo y PRO_Nombre):**
```json
{
  "PRO_Codigo": "MUE-002",
  "PRO_Nombre": "Mesa de Comedor",
  "PRO_Estado": "ACTIVO",
  "TIP_Tipo_Producto": 3,
  "MAP_Material": 2,
  "COP_Color_Producto": 1,
  "DEP_Peso": 25.5,
  "DEP_Longitud": 2.0,
  "PRE_Precio": 500000,
  "PRE_Fecha_Inicio": "2026-04-28"
}
```

**Respuesta (Producto completo):**
```json
{
  "ok": true,
  "message": "Producto creado exitosamente.",
  "data": {
    "PRO_Producto": 2,
    "PRO_Codigo": "MUE-002",
    "PRO_Nombre": "Mesa de Comedor",
    "PRO_Estado": "ACTIVO",
    "DEP_Detalle_Producto": 11,
    "TIP_Tipo_Producto": 3,
    "TIP_Nombre": "Mesas",
    "MAP_Material": 2,
    "COP_Color_Producto": 1,
    "DEP_Peso": 25.5,
    "DEP_Longitud": 2.0,
    "PRE_Precio": 500000
  }
}
```

---

### 4. **Actualizar Producto** ✨ ACTUALIZADO

```http
PUT /api/productos/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "PRO_Codigo": "MUE-002-V2",
  "PRO_Nombre": "Mesa de Comedor Premium",
  "PRO_Estado": "ACTIVO",
  "TIP_Tipo_Producto": 3,
  "MAP_Material": 2,
  "COP_Color_Producto": 2,
  "DEP_Peso": 26.0,
  "DEP_Longitud": 2.0,
  "PRE_Precio": 550000
}
```

**Respuesta (Producto actualizado):**
```json
{
  "ok": true,
  "message": "Producto actualizado exitosamente.",
  "data": {
    "PRO_Producto": 2,
    "PRO_Codigo": "MUE-002-V2",
    "PRO_Nombre": "Mesa de Comedor Premium",
    "PRO_Estado": "ACTIVO",
    "DEP_Detalle_Producto": 11,
    "TIP_Tipo_Producto": 3,
    "TIP_Nombre": "Mesas",
    "MAP_Material": 2,
    "COP_Color_Producto": 2,
    "DEP_Peso": 26.0,
    "DEP_Longitud": 2.0,
    "PRE_Precio": 550000
  }
}
```

---

### 5. **Cambiar Estado Producto**
```http
PATCH /api/productos/:id/estado
Content-Type: application/json
```

**Request Body:**
```json
{
  "PRO_Estado": "INACTIVO"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Estado actualizado exitosamente."
}
```

---

### 6. **Asignar Categoría**
```http
PATCH /api/productos/:id/categoria
Content-Type: application/json
```

**Request Body:**
```json
{
  "TIP_Tipo_Producto": 5
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Mueble vinculado a la categoria correctamente."
}
```

---

### 7. **Listar Materiales**
```http
GET /api/productos/materiales
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "MAP_Material_Producto": 1,
      "MAP_Nombre": "Madera de Pino"
    },
    {
      "MAP_Material_Producto": 2,
      "MAP_Nombre": "Madera de Roble"
    }
  ]
}
```

---

### 8. **Listar Colores**
```http
GET /api/productos/colores
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "COP_Color_Producto": 1,
      "COP_Nombre": "Negro",
      "COP_Estado": "ACTIVO"
    },
    {
      "COP_Color_Producto": 2,
      "COP_Nombre": "Blanco",
      "COP_Estado": "ACTIVO"
    }
  ]
}
```

---

## Estructura de Datos

### Interface `NuevoProducto` (Request)
```typescript
{
  PRO_Codigo: string;              // ✅ Requerido
  PRO_Nombre: string;              // ✅ Requerido
  PRO_Estado?: string;             // Opcional, default: "ACTIVO"
  TIP_Tipo_Producto?: number;      // Opcional, categoría del producto
  MAP_Material?: number;           // Opcional, material del producto
  COP_Color_Producto?: number;     // Opcional, color del producto
  DEP_Peso?: number;               // Opcional, peso en kg
  DEP_Longitud?: number;           // Opcional, longitud en metros
  PRE_Precio?: number;             // ✨ NUEVO - Opcional, precio actual
  PRE_Fecha_Inicio?: string;       // ✨ NUEVO - Opcional, ISO date (default: hoy)
}
```

### Interface `ProductoCompleto` (Response)
```typescript
{
  PRO_Producto: number;
  PRO_Codigo: string;
  PRO_Nombre: string;
  PRO_Estado: string;
  DEP_Detalle_Producto?: number;   // ID del detalle del producto
  TIP_Tipo_Producto?: number;      // ID del tipo/categoría
  TIP_Nombre?: string;             // Nombre de la categoría
  MAP_Material?: number;           // ID del material
  COP_Color_Producto?: number;     // ID del color
  DEP_Peso?: number;               // Peso en kg
  DEP_Longitud?: number;           // Longitud en metros
  PRE_Precio?: number;             // Precio actual vigente
}
```

---

## Transacciones y Manejo de Errores

### Al Crear o Actualizar Producto:
1. ✅ Inserta/Actualiza `MUE_PRODUCTO`
2. ✅ Inserta/Actualiza `MUE_DETALLE_PRODUCTO` (si se proporcionan tipo, material, color)
3. ✅ **Gestiona histórico de precios**:
   - Cierra precio anterior con `PRE_Fecha_Fin = hoy`
   - Inserta nuevo precio activo
4. ✅ **Commit automático** si todo es exitoso
5. ✅ **Rollback automático** si hay error

### Errores Posibles:
```json
// Código duplicado
{
  "ok": false,
  "message": "Ya existe un producto con ese codigo.",
  "statusCode": 409
}

// Producto no encontrado (actualizar)
{
  "ok": false,
  "message": "Producto no encontrado.",
  "statusCode": 404
}

// Validación fallida
{
  "ok": false,
  "message": "El nombre del producto es requerido.",
  "statusCode": 400
}
```

---

## Notas Importantes

### Relación de Campos:
- **"Categoría"** en frontend = `TIP_Tipo_Producto` en BD
- **"Tipo de Producto"** = `TIP_Tipo_Producto` (ej: Sillas, Mesas, Camas)
- **"Material"** = `MAP_Material_Producto` (ej: Madera de Pino, Madera de Roble)
- **"Color"** = `COP_Color_Producto` (ej: Negro, Blanco, Rojo)

### Histórico de Precios:
- Los precios anteriores se mantienen en `MUE_PRECIOPRODUCTO`
- Cada precio nuevo cierra el anterior automáticamente
- La API devuelve el precio activo (con `PRE_Fecha_Fin IS NULL`)
- Precio activo = más reciente con `PRE_Fecha_Inicio <= hoy` y `PRE_Fecha_Fin IS NULL`

### Campos Opcionales en Detalle:
- Si NO envías `TIP_Tipo_Producto`, `MAP_Material`, o `COP_Color_Producto`, no se inserta en `MUE_DETALLE_PRODUCTO`
- Si YES envías TODOS estos tres campos, se crea/actualiza el detalle
- Si envías solo algunos, se ignoran (evita data inconsistente)

### Precio:
- Si NO envías `PRE_Precio`, no se inserta en `MUE_PRECIOPRODUCTO`
- Si YES envías `PRE_Precio`, se inserta nuevo registro de precio
- Si actualizas con nuevo `PRE_Precio`, el anterior se cierra automáticamente
- `PRE_Fecha_Inicio` por defecto es la fecha actual si no se especifica

---

## Ejemplo de Flujo Completo Frontend

```typescript
// 1. Crear producto con todos los detalles
const nuevoProducto = {
  PRO_Codigo: "MUE-003",
  PRO_Nombre: "Cama King Size",
  PRO_Estado: "ACTIVO",
  TIP_Tipo_Producto: 4,      // Camas
  MAP_Material: 1,           // Madera de Pino
  COP_Color_Producto: 1,     // Negro
  DEP_Peso: 40,
  DEP_Longitud: 2.5,
  PRE_Precio: 800000,
  PRE_Fecha_Inicio: "2026-04-28"
};

const response = await fetch('/api/productos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(nuevoProducto)
});

const resultado = await response.json();
console.log(resultado.data); // Producto completo con ID generado

// 2. Actualizar precio
const actualizacion = {
  ...nuevoProducto,
  PRE_Precio: 850000  // Nuevo precio
};

const updateResponse = await fetch(`/api/productos/${resultado.data.PRO_Producto}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(actualizacion)
});

// 3. Obtener producto con detalles actualizados
const getResponse = await fetch(`/api/productos/${resultado.data.PRO_Producto}`);
const productoActualizado = await getResponse.json();
console.log(productoActualizado.data.PRE_Precio); // 850000
```

---

## Compatibilidad

✅ **Todos los endpoints existentes funcionan sin cambios**
✅ **No hay breaking changes**
✅ **Las respuestas ahora incluyen más información**
✅ **Frontend puede hacer CRUD completo de productos**
