# Oliver Pizzas · Menú web con pedidos por WhatsApp

Página de un solo archivo (`index.html`) basada en el menú impreso. No necesita servidor ni base de datos.

## Qué incluye
- **Pizzas 2x1** (Chica, Mediana, Grande, Familiar): modal para armar las 2 pizzas, mitad y mitad desde mediana, orilla rellena por pizza.
- **Paquetes** (Mega, Cuadrada, Familiar, Grande): elige especialidades, orilla y el sabor del refresco gratis.
- **Especialidades**: al tocar una se abre el 2x1 con esa especialidad ya elegida.
- **Refrescos 2 lt**: se agregan con un toque.
- **Carrito** (se guarda aunque se cierre la página), datos de entrega, ubicación GPS opcional, forma de pago y cálculo de cambio.
- El pedido se envía **ordenado al WhatsApp del negocio** (`wa.me/522281850938`) con folio, cliente, dirección, detalle y total.

## Panel de administración
Botón “Panel de administración” en el pie de página o `index.html#admin`. **PIN inicial: `1234`** (cámbialo en la pestaña Negocio).

Desde ahí se edita: datos del negocio, WhatsApp, teléfonos, formas de pago, abierto/cerrado, precios y tamaños 2x1, costo de orilla, paquetes (con imagen), especialidades (agregar, ocultar, ordenar) y refrescos.

### Publicar los cambios para todos los clientes
Los cambios del panel se guardan en el navegador donde se hicieron. Para que los vean todos:
1. Panel → **Respaldo** → **Descargar menu.json**.
2. Sube `menu.json` a la misma carpeta que `index.html` en tu hosting.

La página carga `menu.json` automáticamente si existe. (El PIN está en el código de la página, así que solo evita que un cliente edite por accidente; no es una protección fuerte.)

## Probar localmente
```bash
cd oliver-pizzas && python3 -m http.server 8000
# abrir http://localhost:8000
```
