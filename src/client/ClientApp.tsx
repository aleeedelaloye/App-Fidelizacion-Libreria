import { FormEvent, useState } from 'react'
import '../App.css'
import {
  Client,
  LoyaltyData,
  User,
  authenticate,
  hashPassword,
  loadData,
  nextId,
  promotionApplies,
  rankForPoints,
  saveData,
} from '../shared/store'

function ClientApp() {
  const [data, setData] = useState<LoyaltyData>(() => loadData())
  const [session, setSession] = useState<User | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [login, setLogin] = useState({
    identifier: data.users.find((user) => user.role === 'client')?.email || '',
    password: 'cliente123',
  })
  const [register, setRegister] = useState({
    name: '',
    dni: '',
    phone: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const client = data.clients.find((item) => item.id === session?.clientId)
  const purchases = data.purchases.filter((item) => item.clientId === client?.id)
  const redemptions = data.redemptions.filter((item) => item.clientId === client?.id)
  const activePromotions = client
    ? data.promotions.filter((promotion) =>
        promotionApplies(promotion, client.rank),
      )
    : []
  const notifications = data.notifications.filter(
    (notification) => !notification.clientId || notification.clientId === client?.id,
  )
  const activeRewards = data.rewards.filter((reward) => reward.active)
  const rankOrder = ['Bronce', 'Plata', 'Oro', 'Diamante'] as const
  const nextRank = client
    ? rankOrder[rankOrder.indexOf(client.rank) + 1]
    : undefined
  const nextRankPoints = nextRank ? data.settings.ranks[nextRank].minPoints : client?.points || 0
  const progress = client && nextRankPoints
    ? Math.min(100, Math.round((client.points / nextRankPoints) * 100))
    : 100

  function persist(nextData: LoyaltyData) {
    setData(nextData)
    saveData(nextData)
  }

  function pointsExpireAt() {
    const date = new Date()
    date.setMonth(date.getMonth() + data.settings.pointsExpirationMonths)
    return date.toISOString().slice(0, 10)
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault()
    const user = authenticate(data, login.identifier, login.password)
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
      !register.dni.trim() ||
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
      dni: register.dni.trim(),
      phone: register.phone.trim(),
      email: register.email.trim(),
      points: 0,
      rank: rankForPoints(0),
      pointsExpireAt: pointsExpireAt(),
    }
    const user: User = {
      id: nextId(data.users),
      name: client.name,
      email: client.email,
      passwordHash: hashPassword(register.password),
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

  function recoverPassword() {
    const user = data.users.find((item) => {
      const userClient = data.clients.find((clientItem) => clientItem.id === item.clientId)
      const normalized = login.identifier.trim().toLowerCase()
      const digits = login.identifier.replace(/\D/g, '')
      return (
        item.role === 'client' &&
        (item.email.toLowerCase() === normalized ||
          userClient?.phone.replace(/\D/g, '') === digits ||
          userClient?.dni.replace(/\D/g, '') === digits)
      )
    })
    if (!user) {
      setError('No encontramos una cuenta con ese dato.')
      return
    }

    persist({
      ...data,
      users: data.users.map((item) =>
        item.id === user.id
          ? { ...item, passwordHash: hashPassword('cliente123') }
          : item,
      ),
      notifications: [
        {
          id: nextId(data.notifications),
          clientId: user.clientId,
          title: 'Clave recuperada',
          message: 'Tu clave demo fue restablecida a cliente123.',
          type: 'security',
          date: new Date().toISOString().slice(0, 10),
          read: false,
        },
        ...data.notifications,
      ],
    })
    setError('Clave demo restablecida: cliente123')
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
            <h1>{data.settings.bookstoreName}</h1>
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
                  placeholder="DNI"
                  value={register.dni}
                  onChange={(event) =>
                    setRegister({ ...register, dni: event.target.value })
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
              placeholder={mode === 'login' ? 'Email, DNI o telefono' : 'Email'}
              value={mode === 'login' ? login.identifier : register.email}
              onChange={(event) =>
                mode === 'login'
                  ? setLogin({ ...login, identifier: event.target.value })
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
            {mode === 'login' && (
              <button
                className="secondary-button"
                type="button"
                onClick={recoverPassword}
              >
                Recuperar clave demo
              </button>
            )}
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
        <header className="client-hero member-hero">
          <button className="ghost-button" onClick={() => setSession(null)}>
            Salir
          </button>
          <p>{data.settings.bookstoreName}</p>
          <div className="member-card">
            <span>Socio lector</span>
            <strong>{client.name}</strong>
            <small>DNI {client.dni} - {client.rank}</small>
            <div className="fake-qr" aria-label="QR de socio">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="points-summary">
            <strong>{client.points}</strong>
            <span>puntos disponibles</span>
          </div>
          <div className="rank-progress">
            <span>
              {nextRank
                ? `${progress}% hacia ${nextRank}`
                : 'Rango maximo alcanzado'}
            </span>
            <div>
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
          <small>{data.settings.ranks[client.rank].benefit}</small>
        </header>

        <section className="client-section">
          <h2>Notificaciones</h2>
          {notifications.length ? (
            notifications.slice(0, 4).map((notification) => (
              <article className="notification-card" key={notification.id}>
                <strong>{notification.title}</strong>
                <small>{notification.message}</small>
              </article>
            ))
          ) : (
            <p className="empty-state">Sin novedades por ahora.</p>
          )}
        </section>

        <section className="client-section">
          <h2>Promociones activas</h2>
          {activePromotions.length ? (
            activePromotions.map((promotion) => (
              <article className="client-promotion" key={promotion.id}>
                <span>
                  <strong>{promotion.title}</strong>
                  <small>{promotion.description}</small>
                </span>
                <b>
                  {promotion.type === 'pointsMultiplier'
                    ? `x${promotion.value}`
                    : `${promotion.value}%`}
                </b>
              </article>
            ))
          ) : (
            <p className="empty-state">Sin promociones disponibles.</p>
          )}
        </section>

        <section className="client-section">
          <h2>Canjes disponibles</h2>
          {activeRewards.map((reward) => (
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
