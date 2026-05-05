import { FormEvent, useMemo, useState } from 'react'
import '../App.css'
import {
  Client,
  LoyaltyData,
  Role,
  User,
  authenticate,
  createDemoData,
  currency,
  loadData,
  nextId,
  pointsPerPeso,
  rankForPoints,
  saveData,
  today,
} from '../shared/store'

function OwnerApp() {
  const [data, setData] = useState<LoyaltyData>(() => loadData())
  const [session, setSession] = useState<User | null>(null)
  const [selectedClientId, setSelectedClientId] = useState(data.clients[0]?.id)
  const [search, setSearch] = useState('')
  const [login, setLogin] = useState({
    email: 'admin@libreria.com',
    password: 'admin123',
  })
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'seller' as Role,
  })
  const [purchase, setPurchase] = useState({ amount: '', detail: '' })
  const [loginError, setLoginError] = useState('')

  const selectedClient = data.clients.find(
    (client) => client.id === selectedClientId,
  )
  const filteredClients = data.clients.filter((client) =>
    `${client.name} ${client.phone} ${client.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const clientPurchases = data.purchases.filter(
    (item) => item.clientId === selectedClientId,
  )
  const clientRedemptions = data.redemptions.filter(
    (item) => item.clientId === selectedClientId,
  )
  const totalSales = data.purchases.reduce((sum, item) => sum + item.amount, 0)
  const totalPoints = data.clients.reduce((sum, client) => sum + client.points, 0)
  const previewPoints = Math.floor(Number(purchase.amount || 0) * pointsPerPeso)
  const canManageUsers = session?.role === 'owner'

  const usersByRole = useMemo(
    () =>
      data.users.reduce<Record<Role, number>>(
        (acc, user) => {
          acc[user.role] += 1
          return acc
        },
        { owner: 0, seller: 0, client: 0 },
      ),
    [data.users],
  )

  function persist(nextData: LoyaltyData) {
    setData(nextData)
    saveData(nextData)
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault()
    const user = authenticate(data, login.email, login.password)
    if (!user || user.role === 'client') {
      setLoginError('Usuario o clave incorrecta para el sistema Windows.')
      return
    }

    setSession(user)
    setLoginError('')
  }

  function resetDemoData() {
    const nextData = createDemoData(30)
    persist(nextData)
    setSelectedClientId(nextData.clients[0].id)
    setSearch('')
  }

  function addClient(event: FormEvent) {
    event.preventDefault()
    if (!newClient.name.trim() || !newClient.phone.trim()) return

    const client: Client = {
      id: nextId(data.clients),
      name: newClient.name.trim(),
      phone: newClient.phone.trim(),
      email: newClient.email.trim(),
      points: 0,
      rank: 'Bronce',
    }

    const user: User | null = client.email
      ? {
          id: nextId(data.users),
          name: client.name,
          email: client.email,
          password: 'cliente123',
          role: 'client',
          clientId: client.id,
          active: true,
        }
      : null

    persist({
      ...data,
      clients: [client, ...data.clients],
      users: user ? [user, ...data.users] : data.users,
    })
    setSelectedClientId(client.id)
    setNewClient({ name: '', phone: '', email: '' })
  }

  function addUser(event: FormEvent) {
    event.preventDefault()
    if (!canManageUsers || !newUser.name || !newUser.email || !newUser.password) {
      return
    }

    const user: User = {
      id: nextId(data.users),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password,
      role: newUser.role,
      active: true,
    }

    persist({ ...data, users: [user, ...data.users] })
    setNewUser({ name: '', email: '', password: '', role: 'seller' })
  }

  function addPurchase(event: FormEvent) {
    event.preventDefault()
    const amount = Number(purchase.amount)
    if (!selectedClient || amount <= 0) return

    const points = Math.floor(amount * pointsPerPeso)
    const updatedClients = data.clients.map((client) => {
      if (client.id !== selectedClient.id) return client
      const nextPoints = client.points + points
      return { ...client, points: nextPoints, rank: rankForPoints(nextPoints) }
    })

    persist({
      ...data,
      clients: updatedClients,
      purchases: [
        {
          id: nextId(data.purchases),
          clientId: selectedClient.id,
          date: today(),
          amount,
          points,
          detail: purchase.detail.trim() || 'Compra en libreria',
        },
        ...data.purchases,
      ],
    })
    setPurchase({ amount: '', detail: '' })
  }

  function redeem(rewardId: number) {
    if (!selectedClient) return
    const reward = data.rewards.find((item) => item.id === rewardId)
    if (!reward || selectedClient.points < reward.points) return

    const updatedClients = data.clients.map((client) => {
      if (client.id !== selectedClient.id) return client
      const nextPoints = client.points - reward.points
      return { ...client, points: nextPoints, rank: rankForPoints(nextPoints) }
    })

    persist({
      ...data,
      clients: updatedClients,
      redemptions: [
        {
          id: nextId(data.redemptions),
          clientId: selectedClient.id,
          date: today(),
          reward: reward.title,
          points: reward.points,
        },
        ...data.redemptions,
      ],
    })
  }

  if (!session) {
    return (
      <main className="app-shell auth-layout">
        <form className="panel auth-card" onSubmit={handleLogin}>
          <p className="eyebrow">Servidor Windows</p>
          <h1>Libreria Punto Lector</h1>
          <p className="muted">
            Acceso exclusivo para dueno y vendedores. Demo: admin@libreria.com /
            admin123.
          </p>
          <input
            className="field"
            placeholder="Email"
            value={login.email}
            onChange={(event) => setLogin({ ...login, email: event.target.value })}
          />
          <input
            className="field"
            placeholder="Clave"
            type="password"
            value={login.password}
            onChange={(event) =>
              setLogin({ ...login, password: event.target.value })
            }
          />
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="primary-button" type="submit">
            Entrar al servidor
          </button>
          <a className="text-link" href="/client.html">
            Abrir app de clientes
          </a>
        </form>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Servidor Windows privado</p>
          <h1>Panel de libreria</h1>
          <span className="muted">
            {session.name} - {session.role}
          </span>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={resetDemoData}>
            Regenerar base
          </button>
          <a className="secondary-button text-button" href="/client.html">
            Ver APK cliente
          </a>
          <button className="secondary-button" onClick={() => setSession(null)}>
            Salir
          </button>
        </div>
      </header>

      <section className="seller-layout">
        <aside className="panel client-panel">
          <div className="section-title">
            <span>Clientes</span>
            <strong>{data.clients.length}</strong>
          </div>
          <input
            className="field"
            placeholder="Buscar por nombre, telefono o email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="client-list">
            {filteredClients.map((client) => (
              <button
                className={`client-row ${
                  client.id === selectedClientId ? 'selected' : ''
                }`}
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
              >
                <span>
                  <strong>{client.name}</strong>
                  <small>
                    {client.rank} - {client.phone}
                  </small>
                </span>
                <b>{client.points} pts</b>
              </button>
            ))}
          </div>
          <form className="stacked-form" onSubmit={addClient}>
            <h2>Alta de cliente</h2>
            <input
              className="field"
              placeholder="Nombre"
              value={newClient.name}
              onChange={(event) =>
                setNewClient({ ...newClient, name: event.target.value })
              }
            />
            <input
              className="field"
              placeholder="Telefono"
              value={newClient.phone}
              onChange={(event) =>
                setNewClient({ ...newClient, phone: event.target.value })
              }
            />
            <input
              className="field"
              placeholder="Email para acceso APK"
              value={newClient.email}
              onChange={(event) =>
                setNewClient({ ...newClient, email: event.target.value })
              }
            />
            <button className="primary-button" type="submit">
              Crear cliente
            </button>
          </form>
        </aside>

        <section className="workspace">
          <div className="stats-grid">
            <article className="metric">
              <span>Ventas</span>
              <strong>{currency(totalSales)}</strong>
            </article>
            <article className="metric">
              <span>Puntos activos</span>
              <strong>{totalPoints}</strong>
            </article>
            <article className="metric">
              <span>Canjes</span>
              <strong>{data.redemptions.length}</strong>
            </article>
            <article className="metric">
              <span>Usuarios</span>
              <strong>{data.users.length}</strong>
            </article>
          </div>

          {selectedClient && (
            <div className="panel customer-detail">
              <div className="customer-heading">
                <div>
                  <p className="eyebrow">Cuenta seleccionada</p>
                  <h2>{selectedClient.name}</h2>
                  <span>
                    {selectedClient.email || selectedClient.phone} - Rango{' '}
                    {selectedClient.rank}
                  </span>
                </div>
                <div className="points-badge">
                  <b>{selectedClient.points}</b>
                  <span>puntos</span>
                </div>
              </div>
              <form className="purchase-form" onSubmit={addPurchase}>
                <label>
                  Importe de compra
                  <input
                    className="field"
                    type="number"
                    min="0"
                    placeholder="Ej: 12500"
                    value={purchase.amount}
                    onChange={(event) =>
                      setPurchase({ ...purchase, amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  Detalle
                  <input
                    className="field"
                    placeholder="Ej: libro infantil"
                    value={purchase.detail}
                    onChange={(event) =>
                      setPurchase({ ...purchase, detail: event.target.value })
                    }
                  />
                </label>
                <div className="points-preview">
                  <span>Suma</span>
                  <strong>{previewPoints} pts</strong>
                </div>
                <button className="primary-button" type="submit">
                  Registrar compra
                </button>
              </form>
            </div>
          )}

          <div className="two-columns">
            <section className="panel">
              <div className="section-title">
                <span>Canjes</span>
                <strong>{data.rewards.length}</strong>
              </div>
              <div className="reward-list">
                {data.rewards.map((reward) => (
                  <article className="reward-card" key={reward.id}>
                    <div>
                      <h3>{reward.title}</h3>
                      <p>{reward.description}</p>
                    </div>
                    <button
                      disabled={!selectedClient || selectedClient.points < reward.points}
                      onClick={() => redeem(reward.id)}
                    >
                      {reward.points} pts
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-title">
                <span>Historial</span>
              </div>
              <div className="history-list">
                {[...clientPurchases, ...clientRedemptions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item) => (
                    <article className="history-row" key={`${item.id}-${item.date}`}>
                      <span>
                        <strong>
                          {'amount' in item ? item.detail : item.reward}
                        </strong>
                        <small>
                          {item.date} -{' '}
                          {'amount' in item ? currency(item.amount) : 'Canje'}
                        </small>
                      </span>
                      <b>
                        {'amount' in item ? '+' : '-'}
                        {item.points} pts
                      </b>
                    </article>
                  ))}
              </div>
            </section>
          </div>

          {canManageUsers && (
            <section className="panel">
              <div className="section-title">
                <span>Usuarios y permisos</span>
                <strong>
                  Duenos {usersByRole.owner} - Vendedores {usersByRole.seller}
                </strong>
              </div>
              <form className="user-form" onSubmit={addUser}>
                <input
                  className="field"
                  placeholder="Nombre"
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser({ ...newUser, name: event.target.value })
                  }
                />
                <input
                  className="field"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser({ ...newUser, email: event.target.value })
                  }
                />
                <input
                  className="field"
                  placeholder="Clave"
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser({ ...newUser, password: event.target.value })
                  }
                />
                <select
                  className="field"
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser({ ...newUser, role: event.target.value as Role })
                  }
                >
                  <option value="seller">Vendedor</option>
                  <option value="owner">Dueno</option>
                </select>
                <button className="primary-button" type="submit">
                  Crear usuario
                </button>
              </form>
            </section>
          )}
        </section>
      </section>
    </main>
  )
}

export default OwnerApp
