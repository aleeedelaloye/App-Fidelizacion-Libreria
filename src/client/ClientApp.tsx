import { FormEvent, useState } from 'react'
import '../App.css'
import {
  Client,
  LoyaltyData,
  User,
  authenticate,
  loadData,
  nextId,
  rankForPoints,
  saveData,
} from '../shared/store'

function ClientApp() {
  const [data, setData] = useState<LoyaltyData>(() => loadData())
  const [session, setSession] = useState<User | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [login, setLogin] = useState({
    email: data.users.find((user) => user.role === 'client')?.email || '',
    password: 'cliente123',
  })
  const [register, setRegister] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const client = data.clients.find((item) => item.id === session?.clientId)
  const purchases = data.purchases.filter((item) => item.clientId === client?.id)
  const redemptions = data.redemptions.filter((item) => item.clientId === client?.id)

  function persist(nextData: LoyaltyData) {
    setData(nextData)
    saveData(nextData)
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault()
    const user = authenticate(data, login.email, login.password)
    if (!user || user.role !== 'client') {
      setError('Email o clave incorrecta.')
      return
    }

    setSession(user)
    setError('')
  }

  function handleRegister(event: FormEvent) {
    event.preventDefault()
    if (
      !register.name.trim() ||
      !register.phone.trim() ||
      !register.email.trim() ||
      !register.password
    ) {
      setError('Completa nombre, telefono, email y clave.')
      return
    }

    const exists = data.users.some(
      (user) => user.email.toLowerCase() === register.email.toLowerCase(),
    )
    if (exists) {
      setError('Ese email ya tiene una cuenta.')
      return
    }

    const client: Client = {
      id: nextId(data.clients),
      name: register.name.trim(),
      phone: register.phone.trim(),
      email: register.email.trim(),
      points: 0,
      rank: rankForPoints(0),
    }
    const user: User = {
      id: nextId(data.users),
      name: client.name,
      email: client.email,
      password: register.password,
      role: 'client',
      clientId: client.id,
      active: true,
    }

    persist({
      ...data,
      clients: [client, ...data.clients],
      users: [user, ...data.users],
    })
    setSession(user)
    setError('')
  }

  if (!session || !client) {
    return (
      <main className="app-shell mobile-stage">
        <div className="phone-frame">
          <form
            className="client-auth"
            onSubmit={mode === 'login' ? handleLogin : handleRegister}
          >
            <p className="eyebrow">APK clientes</p>
            <h1>Punto Lector</h1>
            <div className="mode-switch compact-switch">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => setMode('login')}
              >
                Ingresar
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => setMode('register')}
              >
                Registro
              </button>
            </div>

            {mode === 'register' && (
              <>
                <input
                  className="field"
                  placeholder="Nombre completo"
                  value={register.name}
                  onChange={(event) =>
                    setRegister({ ...register, name: event.target.value })
                  }
                />
                <input
                  className="field"
                  placeholder="Telefono"
                  value={register.phone}
                  onChange={(event) =>
                    setRegister({ ...register, phone: event.target.value })
                  }
                />
              </>
            )}
            <input
              className="field"
              placeholder="Email"
              value={mode === 'login' ? login.email : register.email}
              onChange={(event) =>
                mode === 'login'
                  ? setLogin({ ...login, email: event.target.value })
                  : setRegister({ ...register, email: event.target.value })
              }
            />
            <input
              className="field"
              placeholder="Clave"
              type="password"
              value={mode === 'login' ? login.password : register.password}
              onChange={(event) =>
                mode === 'login'
                  ? setLogin({ ...login, password: event.target.value })
                  : setRegister({ ...register, password: event.target.value })
              }
            />
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" type="submit">
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
            <a className="text-link" href="/owner.html">
              Soy vendedor o dueno
            </a>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell mobile-stage">
      <div className="phone-frame">
        <header className="client-hero">
          <button className="ghost-button" onClick={() => setSession(null)}>
            Salir
          </button>
          <p>Hola, {client.name}</p>
          <strong>{client.points}</strong>
          <span>{client.rank} - puntos disponibles</span>
        </header>

        <section className="client-section">
          <h2>Canjes disponibles</h2>
          {data.rewards.map((reward) => (
            <article className="client-reward" key={reward.id}>
              <span>
                <strong>{reward.title}</strong>
                <small>{reward.description}</small>
              </span>
              <b>{reward.points} pts</b>
            </article>
          ))}
        </section>

        <section className="client-section">
          <h2>Historial de compras</h2>
          {purchases.length ? (
            purchases.map((purchase) => (
              <article className="client-row-card" key={purchase.id}>
                <span>
                  <strong>{purchase.detail}</strong>
                  <small>{purchase.date}</small>
                </span>
                <b>+{purchase.points}</b>
              </article>
            ))
          ) : (
            <p className="empty-state">Sin compras registradas.</p>
          )}
        </section>

        <section className="client-section">
          <h2>Historial de canjes</h2>
          {redemptions.length ? (
            redemptions.map((redemption) => (
              <article className="client-row-card" key={redemption.id}>
                <span>
                  <strong>{redemption.reward}</strong>
                  <small>{redemption.date}</small>
                </span>
                <b>-{redemption.points}</b>
              </article>
            ))
          ) : (
            <p className="empty-state">Sin canjes registrados.</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default ClientApp
