# App Fidelizacion Libreria

Sistema MVP para una libreria con dos aplicaciones independientes:

- `owner.html`: servidor/panel Windows para dueno y vendedores.
- `client.html`: app tipo APK para clientes.

## Funciones

- Login con clave.
- Roles: `owner`, `seller`, `client`.
- Alta de clientes y usuarios internos.
- Login de clientes por email, DNI o telefono.
- Rango de cliente por puntos: Bronce, Plata, Oro, Diamante.
- Panel de configuracion para reglas de puntos, vencimiento, rangos, beneficios y datos de la libreria.
- Registro de compras con regla `$10 = 1 punto`.
- Gestion de canjes: crear, editar, pausar y eliminar premios.
- Promociones configurables y notificaciones para clientes.
- Historial de compras y canjes.
- Exportes CSV y opcion de imprimir/guardar PDF desde el navegador.
- APK demo con tarjeta de socio, QR visual y progreso al proximo rango.
- Base demo en `localStorage` para probar sin servidor real.

## Usuarios demo

- Dueno: `admin@libreria.com` / `admin123`
- Vendedor: `vendedor@libreria.com` / `vender123`
- Clientes demo: cualquier cliente generado usa clave `cliente123`

## Ejecutar

```bash
npm install
npm run dev
```

Abrir:

- Inicio: `http://127.0.0.1:5173/`
- Servidor Windows: `http://127.0.0.1:5173/owner.html`
- APK clientes: `http://127.0.0.1:5173/client.html`

Tambien se puede levantar cada entrada:

```bash
npm run dev:owner
npm run dev:client
```

## Proximo paso para produccion

Esta version simula la base en el navegador. Para llevarlo a produccion:

- Backend servidor Windows: Node/Express o .NET con base SQLite/PostgreSQL.
- App Windows: empaquetar `owner.html` con Electron o Tauri.
- APK clientes: empaquetar `client.html` con Capacitor.
- Seguridad real: claves hasheadas, sesiones JWT, HTTPS y permisos por rol.
