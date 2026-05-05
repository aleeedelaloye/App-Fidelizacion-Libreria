import { FormEvent, useEffect, useMemo, useState } from 'react'
import '../App.css'
import {
  Client,
  LoyaltyData,
  Promotion,
  Role,
  User,
  authenticate,
  bestPointsPromotion,
  createDemoData,
  currency,
  hashPassword,
  loadData,
  nextId,
  pointsForAmount,
  rankForPoints,
  saveData,
  syncFromServer,
  today,
} from '../shared/store'

type OwnerPanel =
  | 'clientes'
  | 'ventas'
  | 'canjes'
  | 'historial'
  | 'promociones'
  | 'configuracion'
  | 'exportes'
  | 'usuarios'

function OwnerApp() {
  const [data, setData] = useState<LoyaltyData>(() => loadData())
  const [session, setSession] = useState<User | null>(null)
  const [selectedClientId, setSelectedClientId] = useState(data.clients[0]?.id)
  const [search, setSearch] = useState('')
  const [login, setLogin] = useState({
    email: 'admin@libreria.com',
    password: 'admin123',
  })
  const [newClient, setNewClient] = useState({
    name: '',
    dni: '',
    phone: '',
    email: '',
  })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'seller' as Role,
  })
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    type: 'pointsMultiplier' as Promotion['type'],
    value: '2',
    startDate: today(),
    endDate: today(),
    minRank: 'Bronce' as Promotion['minRank'],
  })
  const [settingsForm, setSettingsForm] = useState(data.settings)
  const [rewardForm, setRewardForm] = useState({
    id: 0,
    title: '',
    points: '500',
    description: '',
  })
  const [purchase, setPurchase] = useState({ amount: '', detail: '' })
  const [loginError, setLoginError] = useState('')
  const [activePanel, setActivePanel] = useState<OwnerPanel>('clientes')
  const [syncStatus, setSyncStatus] = useState('Base local')

  const selectedClient = data.clients.find(
    (client) => client.id === selectedClientId,
  )
  const filteredClients = data.clients.filter((client) =>
    `${client.name} ${client.dni} ${client.phone} ${client.email}`
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
  const activePointsPromotion = selectedClient
    ? bestPointsPromotion(data.promotions, selectedClient.rank)
    : undefined
  const previewBasePoints = pointsForAmount(
    Number(purchase.amount || 0),
    data.settings,
  )
  const previewPoints = activePointsPromotion
    ? Math.floor(previewBasePoints * activePointsPromotion.value)
    : previewBasePoints
  const canManageUsers = session?.role === 'owner'
  const ownerPanels: Array<{ id: OwnerPanel; label: string }> = [
    { id: 'clientes', label: 'Clientes' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'canjes', label: 'Canjes' },
    { id: 'historial', label: 'Historial' },
    ...(canManageUsers
      ? [
          { id: 'promociones' as OwnerPanel, label: 'Promociones' },
          { id: 'configuracion' as OwnerPanel, label: 'Configuracion' },
          { id: 'exportes' as OwnerPanel, label: 'Exportes' },
          { id: 'usuarios' as OwnerPanel, label: 'Usuarios' },
        ]
      : []),
  ]
  const activePanelIndex = ownerPanels.findIndex(
    (panel) => panel.id === activePanel,
  )

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
    setSyncStatus('Guardado en base compartida')
  }

  async function refreshSharedData() {
    try {
      setSyncStatus('Sincronizando...')
      const sharedData = await syncFromServer()
      setData(sharedData)
      setSettingsForm(sharedData.settings)
      setSelectedClientId(sharedData.clients[0]?.id)
      setSyncStatus('Base compartida conectada')
    } catch {
      setSyncStatus('API offline: usando base local')
    }
  }

  useEffect(() => {
    void refreshSharedData()
  }, [])

  function pointsExpireAt() {
    const date = new Date()
    date.setMonth(date.getMonth() + data.settings.pointsExpirationMonths)
    return date.toISOString().slice(0, 10)
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
    setSettingsForm(nextData.settings)
    setSelectedClientId(nextData.clients[0].id)
    setSearch('')
  }

  function addClient(event: FormEvent) {
    event.preventDefault()
    if (!newClient.name.trim() || !newClient.phone.trim()) return

    const client: Client = {
      id: nextId(data.clients),
      name: newClient.name.trim(),
      dni: newClient.dni.trim(),
      phone: newClient.phone.trim(),
      email: newClient.email.trim(),
      points: 0,
      rank: 'Bronce',
      pointsExpireAt: pointsExpireAt(),
    }

    const user: User | null = client.email
      ? {
          id: nextId(data.users),
          name: client.name,
          email: client.email,
          passwordHash: hashPassword('cliente123'),
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
    setNewClient({ name: '', dni: '', phone: '', email: '' })
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
      passwordHash: hashPassword(newUser.password),
      role: newUser.role,
      active: true,
    }

    persist({ ...data, users: [user, ...data.users] })
    setNewUser({ name: '', email: '', password: '', role: 'seller' })
  }

  function addPromotion(event: FormEvent) {
    event.preventDefault()
    if (!canManageUsers || !newPromotion.title.trim()) return

    const promotion: Promotion = {
      id: nextId(data.promotions),
      title: newPromotion.title.trim(),
      description: newPromotion.description.trim() || 'Promocion de libreria',
      type: newPromotion.type,
      value: Number(newPromotion.value),
      startDate: newPromotion.startDate,
      endDate: newPromotion.endDate,
      minRank: newPromotion.minRank,
      active: true,
    }

    persist({ ...data, promotions: [promotion, ...data.promotions] })
    setNewPromotion({
      title: '',
      description: '',
      type: 'pointsMultiplier',
      value: '2',
      startDate: today(),
      endDate: today(),
      minRank: 'Bronce',
    })
  }

  function togglePromotion(promotionId: number) {
    if (!canManageUsers) return
    persist({
      ...data,
      promotions: data.promotions.map((promotion) =>
        promotion.id === promotionId
          ? { ...promotion, active: !promotion.active }
          : promotion,
      ),
    })
  }

  function saveSettings(event: FormEvent) {
    event.preventDefault()
    persist({
      ...data,
      settings: settingsForm,
      clients: data.clients.map((client) => ({
        ...client,
        rank: rankForPoints(client.points, settingsForm),
      })),
      notifications: [
        {
          id: nextId(data.notifications),
          title: 'Configuracion actualizada',
          message: 'La libreria actualizo reglas de puntos y beneficios.',
          type: 'security',
          date: today(),
          read: false,
        },
        ...data.notifications,
      ],
    })
  }

  function saveReward(event: FormEvent) {
    event.preventDefault()
    if (!rewardForm.title.trim()) return

    if (rewardForm.id) {
      persist({
        ...data,
        rewards: data.rewards.map((reward) =>
          reward.id === rewardForm.id
            ? {
                ...reward,
                title: rewardForm.title.trim(),
                points: Number(rewardForm.points),
                description: rewardForm.description.trim(),
              }
            : reward,
        ),
      })
    } else {
      persist({
        ...data,
        rewards: [
          {
            id: nextId(data.rewards),
            title: rewardForm.title.trim(),
            points: Number(rewardForm.points),
            description: rewardForm.description.trim(),
            active: true,
          },
          ...data.rewards,
        ],
        notifications: [
          {
            id: nextId(data.notifications),
            title: 'Nuevo canje disponible',
            message: `${rewardForm.title.trim()} ya esta disponible en la app.`,
            type: 'reward',
            date: today(),
            read: false,
          },
          ...data.notifications,
        ],
      })
    }

    setRewardForm({ id: 0, title: '', points: '500', description: '' })
  }

  function editReward(rewardId: number) {
    const reward = data.rewards.find((item) => item.id === rewardId)
    if (!reward) return
    setRewardForm({
      id: reward.id,
      title: reward.title,
      points: String(reward.points),
      description: reward.description,
    })
  }

  function toggleReward(rewardId: number) {
    persist({
      ...data,
      rewards: data.rewards.map((reward) =>
        reward.id === rewardId ? { ...reward, active: !reward.active } : reward,
      ),
    })
  }

  function deleteReward(rewardId: number) {
    persist({
      ...data,
      rewards: data.rewards.filter((reward) => reward.id !== rewardId),
    })
  }

  function downloadCsv(name: string, rows: string[][]) {
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportClients() {
    downloadCsv('clientes-puntos.csv', [
      ['Nombre', 'DNI', 'Telefono', 'Email', 'Puntos', 'Rango', 'Vencimiento'],
      ...data.clients.map((client) => [
        client.name,
        client.dni,
        client.phone,
        client.email,
        String(client.points),
        client.rank,
        client.pointsExpireAt,
      ]),
    ])
  }

  function exportMovements() {
    downloadCsv('movimientos-fidelizacion.csv', [
      ['Tipo', 'Cliente', 'Fecha', 'Detalle', 'Importe', 'Puntos'],
      ...data.purchases.map((item) => {
        const client = data.clients.find((current) => current.id === item.clientId)
        return [
          'Compra',
          client?.name || '',
          item.date,
          item.detail,
          String(item.amount),
          String(item.points),
        ]
      }),
      ...data.redemptions.map((item) => {
        const client = data.clients.find((current) => current.id === item.clientId)
        return [
          'Canje',
          client?.name || '',
          item.date,
          item.reward,
          '',
          String(item.points),
        ]
      }),
    ])
  }

  function addPurchase(event: FormEvent) {
    event.preventDefault()
    const amount = Number(purchase.amount)
    if (!selectedClient || amount <= 0) return

    const basePoints = pointsForAmount(amount, data.settings)
    const pointsPromotion = bestPointsPromotion(data.promotions, selectedClient.rank)
    const points = pointsPromotion
      ? Math.floor(basePoints * pointsPromotion.value)
      : basePoints
    const updatedClients = data.clients.map((client) => {
      if (client.id !== selectedClient.id) return client
      const nextPoints = client.points + points
      const nextRank = rankForPoints(nextPoints, data.settings)
      return { ...client, points: nextPoints, rank: nextRank }
    })
    const updatedClient = updatedClients.find((client) => client.id === selectedClient.id)
    const rankChanged = updatedClient?.rank !== selectedClient.rank

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
          detail:
            purchase.detail.trim() ||
            (pointsPromotion
              ? `Compra con promo ${pointsPromotion.title}`
              : 'Compra en libreria'),
        },
        ...data.purchases,
      ],
      notifications: rankChanged
        ? [
            {
              id: nextId(data.notifications),
              clientId: selectedClient.id,
              title: 'Cambio de rango',
              message: `Subiste a rango ${updatedClient?.rank}.`,
              type: 'rank',
              date: today(),
              read: false,
            },
            ...data.notifications,
          ]
        : data.notifications,
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
      return {
        ...client,
        points: nextPoints,
        rank: rankForPoints(nextPoints, data.settings),
      }
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
            placeholder="Email de usuario"
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
          <a className="text-link" href="./client.html">
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
            {session.name} - {session.role} - {syncStatus}
          </span>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={refreshSharedData}>
            Sincronizar
          </button>
          <button className="secondary-button" onClick={resetDemoData}>
            Regenerar base
          </button>
          <a className="secondary-button text-button" href="./client.html">
            Ver APK cliente
          </a>
          <button className="secondary-button" onClick={() => setSession(null)}>
            Salir
          </button>
        </div>
      </header>

      <nav className="top-menu" aria-label="Navegacion principal">
        {ownerPanels.map((panel) => (
          <button
            className={activePanel === panel.id ? 'active' : ''}
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
          >
            {panel.label}
          </button>
        ))}
      </nav>

      <section className="seller-layout panel-stage" data-panel-index={activePanelIndex}>
        <aside
          className={`panel client-panel module-panel ${
            activePanel === 'clientes' ? 'is-active' : 'is-hidden'
          }`}
          id="clientes"
        >
          <div className="section-title">
            <span>Clientes</span>
            <strong>{data.clients.length}</strong>
          </div>
          <input
            className="field"
            placeholder="Buscar por nombre, DNI, telefono o email"
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
                    DNI {client.dni} - {client.rank} - {client.phone}
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
              placeholder="DNI"
              value={newClient.dni}
              onChange={(event) =>
                setNewClient({ ...newClient, dni: event.target.value })
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

          <section
            className={`workspace module-workspace ${
              activePanel === 'clientes' ? 'is-hidden' : 'is-active'
            }`}
          >
            <div
              className={`stats-grid ${
                activePanel === 'ventas' ? 'is-active' : 'is-hidden'
              }`}
            >
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
            <article className="metric">
              <span>Promociones</span>
              <strong>{data.promotions.filter((item) => item.active).length}</strong>
            </article>
          </div>

          {selectedClient && (
            <div
              className={`panel customer-detail module-panel ${
                activePanel === 'ventas' ? 'is-active' : 'is-hidden'
              }`}
              id="ventas"
            >
              <div className="customer-heading">
                <div>
                  <p className="eyebrow">Cuenta seleccionada</p>
                  <h2>{selectedClient.name}</h2>
                  <span>
                    DNI {selectedClient.dni} -{' '}
                    {selectedClient.email || selectedClient.phone} - Rango{' '}
                    {selectedClient.rank} - Vence {selectedClient.pointsExpireAt}
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
              {activePointsPromotion && (
                <p className="promo-note">
                  Promo aplicada: {activePointsPromotion.title} x
                  {activePointsPromotion.value} puntos.
                </p>
              )}
            </div>
          )}

          <div
            className={`two-columns ${
              activePanel === 'canjes' || activePanel === 'historial'
                ? 'is-active'
                : 'is-hidden'
            }`}
          >
            <section
              className={`panel module-panel ${
                activePanel === 'canjes' ? 'is-active' : 'is-hidden'
              }`}
              id="canjes"
            >
              <div className="section-title">
                <span>Canjes</span>
                <strong>{data.rewards.length}</strong>
              </div>
              <form className="reward-admin-form" onSubmit={saveReward}>
                <input
                  className="field"
                  placeholder="Premio o beneficio"
                  value={rewardForm.title}
                  onChange={(event) =>
                    setRewardForm({ ...rewardForm, title: event.target.value })
                  }
                />
                <input
                  className="field"
                  type="number"
                  min="1"
                  placeholder="Puntos"
                  value={rewardForm.points}
                  onChange={(event) =>
                    setRewardForm({ ...rewardForm, points: event.target.value })
                  }
                />
                <input
                  className="field"
                  placeholder="Descripcion"
                  value={rewardForm.description}
                  onChange={(event) =>
                    setRewardForm({
                      ...rewardForm,
                      description: event.target.value,
                    })
                  }
                />
                <button className="primary-button" type="submit">
                  {rewardForm.id ? 'Guardar canje' : 'Crear canje'}
                </button>
              </form>
              <div className="reward-list">
                {data.rewards.map((reward) => (
                  <article className="reward-card" key={reward.id}>
                    <div>
                      <h3>{reward.title}</h3>
                      <p>
                        {reward.description} -{' '}
                        {reward.active ? 'Activo' : 'Pausado'}
                      </p>
                    </div>
                    <button
                      disabled={
                        !reward.active ||
                        !selectedClient ||
                        selectedClient.points < reward.points
                      }
                      onClick={() => redeem(reward.id)}
                    >
                      {reward.points} pts
                    </button>
                    <button
                      className="secondary-button compact-action"
                      onClick={() => editReward(reward.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button compact-action"
                      onClick={() => toggleReward(reward.id)}
                    >
                      {reward.active ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      className="secondary-button compact-action"
                      onClick={() => deleteReward(reward.id)}
                    >
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section
              className={`panel module-panel ${
                activePanel === 'historial' ? 'is-active' : 'is-hidden'
              }`}
              id="historial"
            >
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
            <>
              <section
                className={`panel module-panel ${
                  activePanel === 'configuracion' ? 'is-active' : 'is-hidden'
                }`}
                id="configuracion"
              >
                <div className="section-title">
                  <span>Panel de configuracion</span>
                  <strong>{settingsForm.bookstoreName}</strong>
                </div>
                <form className="settings-form" onSubmit={saveSettings}>
                  <input
                    className="field"
                    placeholder="Nombre de la libreria"
                    value={settingsForm.bookstoreName}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        bookstoreName: event.target.value,
                      })
                    }
                  />
                  <input
                    className="field"
                    placeholder="Direccion"
                    value={settingsForm.address}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        address: event.target.value,
                      })
                    }
                  />
                  <input
                    className="field"
                    placeholder="Telefono libreria"
                    value={settingsForm.phone}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        phone: event.target.value,
                      })
                    }
                  />
                  <input
                    className="field"
                    type="number"
                    min="1"
                    placeholder="Pesos por punto"
                    value={settingsForm.pointsMoneyAmount}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        pointsMoneyAmount: Number(event.target.value),
                      })
                    }
                  />
                  <input
                    className="field"
                    type="number"
                    min="1"
                    placeholder="Puntos otorgados"
                    value={settingsForm.pointValue}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        pointValue: Number(event.target.value),
                      })
                    }
                  />
                  <input
                    className="field"
                    type="number"
                    min="1"
                    placeholder="Vencimiento en meses"
                    value={settingsForm.pointsExpirationMonths}
                    onChange={(event) =>
                      setSettingsForm({
                        ...settingsForm,
                        pointsExpirationMonths: Number(event.target.value),
                      })
                    }
                  />
                  {(['Bronce', 'Plata', 'Oro', 'Diamante'] as const).map(
                    (rank) => (
                      <div className="rank-config" key={rank}>
                        <label>
                          Minimo {rank}
                          <input
                            className="field"
                            type="number"
                            min="0"
                            value={settingsForm.ranks[rank].minPoints}
                            onChange={(event) =>
                              setSettingsForm({
                                ...settingsForm,
                                ranks: {
                                  ...settingsForm.ranks,
                                  [rank]: {
                                    ...settingsForm.ranks[rank],
                                    minPoints: Number(event.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </label>
                        <input
                          className="field"
                          placeholder={`Beneficio ${rank}`}
                          value={settingsForm.ranks[rank].benefit}
                          onChange={(event) =>
                            setSettingsForm({
                              ...settingsForm,
                              ranks: {
                                ...settingsForm.ranks,
                                [rank]: {
                                  ...settingsForm.ranks[rank],
                                  benefit: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ),
                  )}
                  <button className="primary-button" type="submit">
                    Guardar configuracion
                  </button>
                </form>
              </section>

              <section
                className={`panel module-panel ${
                  activePanel === 'exportes' ? 'is-active' : 'is-hidden'
                }`}
                id="exportes"
              >
                <div className="section-title">
                  <span>Exportes</span>
                  <strong>CSV / PDF</strong>
                </div>
                <div className="export-actions">
                  <button className="secondary-button" onClick={exportClients}>
                    Exportar clientes CSV
                  </button>
                  <button className="secondary-button" onClick={exportMovements}>
                    Exportar movimientos CSV
                  </button>
                  <button className="secondary-button" onClick={() => window.print()}>
                    Imprimir / PDF
                  </button>
                </div>
              </section>

              <section
                className={`panel module-panel ${
                  activePanel === 'promociones' ? 'is-active' : 'is-hidden'
                }`}
                id="promociones"
              >
                <div className="section-title">
                  <span>Gestion de promociones</span>
                  <strong>{data.promotions.length}</strong>
                </div>
                <form className="promotion-form" onSubmit={addPromotion}>
                  <input
                    className="field"
                    placeholder="Nombre de promocion"
                    value={newPromotion.title}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        title: event.target.value,
                      })
                    }
                  />
                  <input
                    className="field"
                    placeholder="Descripcion"
                    value={newPromotion.description}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        description: event.target.value,
                      })
                    }
                  />
                  <select
                    className="field"
                    value={newPromotion.type}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        type: event.target.value as Promotion['type'],
                        value:
                          event.target.value === 'pointsMultiplier' ? '2' : '10',
                      })
                    }
                  >
                    <option value="pointsMultiplier">Multiplica puntos</option>
                    <option value="discount">Descuento visible</option>
                  </select>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    placeholder="Valor"
                    value={newPromotion.value}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        value: event.target.value,
                      })
                    }
                  />
                  <select
                    className="field"
                    value={newPromotion.minRank}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        minRank: event.target.value as Promotion['minRank'],
                      })
                    }
                  >
                    <option value="Bronce">Bronce</option>
                    <option value="Plata">Plata</option>
                    <option value="Oro">Oro</option>
                    <option value="Diamante">Diamante</option>
                  </select>
                  <input
                    className="field"
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        startDate: event.target.value,
                      })
                    }
                  />
                  <input
                    className="field"
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(event) =>
                      setNewPromotion({
                        ...newPromotion,
                        endDate: event.target.value,
                      })
                    }
                  />
                  <button className="primary-button" type="submit">
                    Crear promo
                  </button>
                </form>
                <div className="promotion-list">
                  {data.promotions.map((promotion) => (
                    <article className="promotion-card" key={promotion.id}>
                      <span>
                        <strong>{promotion.title}</strong>
                        <small>
                          {promotion.description} - Desde {promotion.minRank} -{' '}
                          {promotion.startDate} a {promotion.endDate}
                        </small>
                      </span>
                      <b>
                        {promotion.type === 'pointsMultiplier'
                          ? `x${promotion.value} pts`
                          : `${promotion.value}%`}
                      </b>
                      <button
                        className="secondary-button"
                        onClick={() => togglePromotion(promotion.id)}
                      >
                        {promotion.active ? 'Pausar' : 'Activar'}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section
                className={`panel module-panel ${
                  activePanel === 'usuarios' ? 'is-active' : 'is-hidden'
                }`}
                id="usuarios"
              >
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
                      setNewUser({
                        ...newUser,
                        role: event.target.value as Role,
                      })
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
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default OwnerApp
