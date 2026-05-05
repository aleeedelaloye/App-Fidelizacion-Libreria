import './App.css'
import { appPage } from './shared/navigation'

function App() {
  return (
    <main className="app-shell auth-layout">
      <section className="launcher">
        <p className="eyebrow">Sistema de fidelizacion</p>
        <h1>Libreria Punto Lector</h1>
        <p className="muted">
          Dos aplicaciones independientes: servidor Windows para dueno/vendedor
          y APK para clientes.
        </p>
        <div className="launcher-grid">
          <a className="panel launcher-card" href={appPage('owner.html')}>
            <span>Windows</span>
            <strong>Servidor del dueno</strong>
            <small>Usuarios, roles, clientes, compras, puntos y canjes.</small>
          </a>
          <a className="panel launcher-card" href={appPage('client.html')}>
            <span>APK</span>
            <strong>App de clientes</strong>
            <small>Registro, clave, rango, puntos e historiales.</small>
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
