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
- Base compartida demo por API local con respaldo en `localStorage`.

## Usuarios demo

- Dueno: `admin@libreria.com` / `admin123`
- Vendedor: `vendedor@libreria.com` / `vender123`
- Clientes demo: cualquier cliente generado usa clave `cliente123`

## Ejecutar

```bash
npm install
npm run api
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

La API demo corre en `http://127.0.0.1:8787` y guarda la base en
`data/loyalty-db.json`. Ese archivo queda fuera de Git para no subir datos
reales de clientes.

## Generar APK demo

La APK de clientes se genera con Capacitor:

```bash
npm run android:apk
```

Salida debug:

`android/app/build/outputs/apk/debug/app-debug.apk`

Para compilar se necesita Android Studio/JDK y Android SDK. En esta maquina se
usa el Java incluido en Android Studio.

## Publicar como web

El repositorio incluye GitHub Actions para publicar la demo en GitHub Pages.
Cuando GitHub Pages este habilitado con origen `GitHub Actions`, la web queda en:

`https://aleeedelaloye.github.io/App-Fidelizacion-Libreria/`

Entradas:

- Inicio: `/`
- Panel Windows web: `/owner.html`
- App cliente web: `/client.html`

En GitHub Pages la API local no esta disponible, por eso la demo usa respaldo
en `localStorage` del navegador.

## Proximo paso para produccion

Esta version simula la base en el navegador. Para llevarlo a produccion:

- Backend servidor Windows: reemplazar el JSON demo por SQLite/PostgreSQL.
- App Windows: empaquetar `owner.html` con Electron o Tauri.
- APK clientes: empaquetar `client.html` con Capacitor.
- Seguridad real: claves hasheadas, sesiones JWT, HTTPS y permisos por rol.
