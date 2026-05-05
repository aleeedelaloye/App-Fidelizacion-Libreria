import { FormEvent, useMemo, useState } from 'react'
import './App.css'

type Purchase = {
  id: number
  clientId: number
  date: string
  amount: number
  points: number
  detail: string
}

type Redemption = {
  id: number
  clientId: number
  date: string
  reward: string
  points: number
}

type Client = {
  id: number
  name: string
  phone: string
  email: string
  points: number
}

type Reward = {
  id: number
  title: string
  points: number
  description: string
}

type DemoData = {
  clients: Client[]
  purchases: Purchase[]
  redemptions: Redemption[]
}

const pointsPerPeso = 0.1

const initialRewards: Reward[] = [
  {
    id: 1,
    title: '10% en literatura',
    points: 450,
    description: 'Descuento para novelas, cuentos y poesia.',
  },
  {
    id: 2,
    title: 'Cuaderno premium',
    points: 700,
    description: 'Canje directo por cuaderno tapa dura.',
  },
  {
    id: 3,
    title: '$3500 de credito',
    points: 1200,
    description: 'Saldo para usar en cualquier compra.',
  },
  {
    id: 4,
    title: 'Marcadores artisticos',
    points: 900,
    description: 'Set de color para estudiantes y artistas.',
  },
]

const firstNames = [
  'Marina',
  'Tomas',
  'Lucia',
  'Mateo',
  'Valentina',
  'Sofia',
  'Joaquin',
  'Camila',
  'Nicolas',
  'Martina',
  'Agustin',
  'Paula',
  'Bruno',
  'Carla',
  'Emilia',
  'Facundo',
  'Rocio',
  'Santiago',
  'Julieta',
  'Ignacio',
]

const lastNames = [
  'Lopez',
  'Pereyra',
  'Gomez',
  'Sosa',
  'Romero',
  'Acosta',
  'Benitez',
  'Rojas',
  'Molina',
  'Silva',
  'Castro',
  'Herrera',
  'Vega',
  'Medina',
  'Ortiz',
  'Ibarra',
  'Navarro',
  'Ferreyra',
]

const purchaseDetails = [
  'Novela contemporanea',
  'Libro infantil y stickers',
  'Manga tomo especial',
  'Manual universitario',
  'Agenda y lapiceras',
  'Set de marcadores',
  'Poesia argentina',
  'Libro de cocina',
  'Comic importado',
  'Diccionario escolar',
  'Biografia historica',
  'Resaltadores y cuaderno',
]

const seededDemoData = createDemoData(24)

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(items: T[]) {
  return items[randomNumber(0, items.length - 1)]
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function createDemoData(clientCount = 24): DemoData {
  const clients: Client[] = []
  const purchases: Purchase[] = []
  const redemptions: Redemption[] = []
  let purchaseId = 1
  let redemptionId = 1

  for (let index = 0; index < clientCount; index += 1) {
    const firstName = firstNames[index % firstNames.length]
    const lastName = lastNames[(index * 3) % lastNames.length]
    const client: Client = {
      id: index + 1,
      name: `${firstName} ${lastName}`,
      phone: `341 555 ${String(1000 + index * 37).slice(-4)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      points: 0,
    }

    const purchaseCount = randomNumber(2, 7)
    for (
      let purchaseIndex = 0;
      purchaseIndex < purchaseCount;
      purchaseIndex += 1
    ) {
      const amount = randomNumber(45, 360) * 100
      const points = Math.floor(amount * pointsPerPeso)
      purchases.push({
        id: purchaseId,
        clientId: client.id,
        date: daysAgo(randomNumber(0, 90)),
        amount,
        points,
        detail: randomItem(purchaseDetails),
      })
      client.points += points
      purchaseId += 1
    }

    if (client.points >= initialRewards[0].points && index % 3 !== 1) {
      const redemptionCount = randomNumber(1, 2)
      for (
        let redemptionIndex = 0;
        redemptionIndex < redemptionCount;
        redemptionIndex += 1
      ) {
        const availableRewards = initialRewards.filter(
          (reward) => reward.points <= client.points,
        )
        if (!availableRewards.length) break

        const reward = randomItem(availableRewards)
        redemptions.push({
          id: redemptionId,
          clientId: client.id,
          date: daysAgo(randomNumber(0, 60)),
          reward: reward.title,
          points: reward.points,
        })
        client.points -= reward.points
        redemptionId += 1
      }
    }

    clients.push(client)
  }

  return {
    clients,
    purchases: purchases.sort((a, b) => b.date.localeCompare(a.date)),
    redemptions: redemptions.sort((a, b) => b.date.localeCompare(a.date)),
  }
}

function currency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function App() {
  const [mode, setMode] = useState<'seller' | 'client'>('seller')
  const [clients, setClients] = useState<Client[]>(seededDemoData.clients)
  const [purchases, setPurchases] = useState<Purchase[]>(
    seededDemoData.purchases,
  )
  const [redemptions, setRedemptions] = useState<Redemption[]>(
    seededDemoData.redemptions,
  )
  const [selectedClientId, setSelectedClientId] = useState(
    seededDemoData.clients[0].id,
  )
  const [search, setSearch] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseDetail, setPurchaseDetail] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
  })

  const selectedClient = clients.find((client) => client.id === selectedClientId)
  const filteredClients = clients.filter((client) => {
    const text = `${client.name} ${client.phone} ${client.email}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const clientPurchases = useMemo(
    () =>
      purchases
        .filter((purchase) => purchase.clientId === selectedClientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, selectedClientId],
  )

  const clientRedemptions = useMemo(
    () =>
      redemptions
        .filter((redemption) => redemption.clientId === selectedClientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [redemptions, selectedClientId],
  )

  const totalSales = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
  const totalPoints = clients.reduce((sum, client) => sum + client.points, 0)
  const previewPoints = Math.floor(Number(purchaseAmount || 0) * pointsPerPeso)

  function loadRandomDemoData() {
    const data = createDemoData(30)
    setClients(data.clients)
    setPurchases(data.purchases)
    setRedemptions(data.redemptions)
    setSelectedClientId(data.clients[0].id)
    setSearch('')
  }

  function addClient(event: FormEvent) {
    event.preventDefault()
    if (!newClient.name.trim() || !newClient.phone.trim()) return

    const client: Client = {
      id: Date.now(),
      name: newClient.name.trim(),
      phone: newClient.phone.trim(),
      email: newClient.email.trim(),
      points: 0,
    }

    setClients((current) => [client, ...current])
    setSelectedClientId(client.id)
    setNewClient({ name: '', phone: '', email: '' })
  }

  function addPurchase(event: FormEvent) {
    event.preventDefault()
    const amount = Number(purchaseAmount)
    if (!selectedClient || amount <= 0) return

    const points = Math.floor(amount * pointsPerPeso)
    const purchase: Purchase = {
      id: Date.now(),
      clientId: selectedClient.id,
      date: today(),
      amount,
      points,
      detail: purchaseDetail.trim() || 'Compra en libreria',
    }

    setPurchases((current) => [purchase, ...current])
    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? { ...client, points: client.points + points }
          : client,
      ),
    )
    setPurchaseAmount('')
    setPurchaseDetail('')
  }

  function redeem(reward: Reward) {
    if (!selectedClient || selectedClient.points < reward.points) return

    const redemption: Redemption = {
      id: Date.now(),
      clientId: selectedClient.id,
      date: today(),
      reward: reward.title,
      points: reward.points,
    }

    setRedemptions((current) => [redemption, ...current])
    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? { ...client, points: client.points - reward.points }
          : client,
      ),
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sistema de fidelizacion</p>
          <h1>Libreria Punto Lector</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={loadRandomDemoData}>
            Generar datos de prueba
          </button>
          <div className="mode-switch" aria-label="Cambiar vista">
            <button
              className={mode === 'seller' ? 'active' : ''}
              onClick={() => setMode('seller')}
            >
              Vendedor
            </button>
            <button
              className={mode === 'client' ? 'active' : ''}
              onClick={() => setMode('client')}
            >
              Cliente
            </button>
          </div>
        </div>
      </header>

      {mode === 'seller' ? (
        <section className="seller-layout">
          <aside className="panel client-panel">
            <div className="section-title">
              <span>Clientes</span>
              <strong>{clients.length}</strong>
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
                    <small>{client.phone}</small>
                  </span>
                  <b>{client.points} pts</b>
                </button>
              ))}
            </div>
            <form className="stacked-form" onSubmit={addClient}>
              <h2>Alta rapida</h2>
              <input
                className="field"
                placeholder="Nombre del cliente"
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
                placeholder="Email opcional"
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
                <span>Ventas cargadas</span>
                <strong>{currency(totalSales)}</strong>
              </article>
              <article className="metric">
                <span>Puntos activos</span>
                <strong>{totalPoints}</strong>
              </article>
              <article className="metric">
                <span>Canjes registrados</span>
                <strong>{redemptions.length}</strong>
              </article>
              <article className="metric">
                <span>Regla actual</span>
                <strong>$10 = 1 pt</strong>
              </article>
            </div>

            {selectedClient && (
              <div className="panel customer-detail">
                <div className="customer-heading">
                  <div>
                    <p className="eyebrow">Cuenta seleccionada</p>
                    <h2>{selectedClient.name}</h2>
                    <span>{selectedClient.email || selectedClient.phone}</span>
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
                      value={purchaseAmount}
                      onChange={(event) =>
                        setPurchaseAmount(event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Detalle
                    <input
                      className="field"
                      placeholder="Ej: libro infantil"
                      value={purchaseDetail}
                      onChange={(event) =>
                        setPurchaseDetail(event.target.value)
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
                  <span>Opciones de canje</span>
                  <strong>{initialRewards.length}</strong>
                </div>
                <div className="reward-list">
                  {initialRewards.map((reward) => (
                    <article className="reward-card" key={reward.id}>
                      <div>
                        <h3>{reward.title}</h3>
                        <p>{reward.description}</p>
                      </div>
                      <button
                        disabled={
                          !selectedClient || selectedClient.points < reward.points
                        }
                        onClick={() => redeem(reward)}
                      >
                        {reward.points} pts
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="section-title">
                  <span>Historial reciente</span>
                </div>
                <History
                  purchases={clientPurchases}
                  redemptions={clientRedemptions}
                />
              </section>
            </div>
          </section>
        </section>
      ) : (
        <ClientApp
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          purchases={clientPurchases}
          redemptions={clientRedemptions}
        />
      )}
    </main>
  )
}

function History({
  purchases,
  redemptions,
}: {
  purchases: Purchase[]
  redemptions: Redemption[]
}) {
  const rows = [
    ...purchases.map((purchase) => ({
      id: `p-${purchase.id}`,
      date: purchase.date,
      title: purchase.detail,
      meta: currency(purchase.amount),
      points: `+${purchase.points}`,
    })),
    ...redemptions.map((redemption) => ({
      id: `r-${redemption.id}`,
      date: redemption.date,
      title: redemption.reward,
      meta: 'Canje',
      points: `-${redemption.points}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  if (!rows.length) {
    return <p className="empty-state">Todavia no hay movimientos.</p>
  }

  return (
    <div className="history-list">
      {rows.map((row) => (
        <article className="history-row" key={row.id}>
          <span>
            <strong>{row.title}</strong>
            <small>
              {row.date} - {row.meta}
            </small>
          </span>
          <b>{row.points} pts</b>
        </article>
      ))}
    </div>
  )
}

function ClientApp({
  clients,
  selectedClientId,
  onSelectClient,
  purchases,
  redemptions,
}: {
  clients: Client[]
  selectedClientId: number
  onSelectClient: (id: number) => void
  purchases: Purchase[]
  redemptions: Redemption[]
}) {
  const selectedClient = clients.find((client) => client.id === selectedClientId)

  if (!selectedClient) return null

  return (
    <section className="mobile-stage">
      <div className="phone-frame">
        <header className="client-hero">
          <select
            value={selectedClientId}
            onChange={(event) => onSelectClient(Number(event.target.value))}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <p>Mis puntos</p>
          <strong>{selectedClient.points}</strong>
          <span>Disponibles para canjear</span>
        </header>

        <section className="client-section">
          <h2>Canjes disponibles</h2>
          {initialRewards.map((reward) => (
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
    </section>
  )
}

export default App
