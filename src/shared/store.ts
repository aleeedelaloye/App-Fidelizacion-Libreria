export type Role = 'owner' | 'seller' | 'client'

export type Rank = 'Bronce' | 'Plata' | 'Oro' | 'Diamante'

export type User = {
  id: number
  name: string
  email: string
  password?: string
  passwordHash?: string
  role: Role
  clientId?: number
  active: boolean
}

export type Client = {
  id: number
  name: string
  dni: string
  phone: string
  email: string
  points: number
  rank: Rank
  pointsExpireAt: string
}

export type Purchase = {
  id: number
  clientId: number
  date: string
  amount: number
  points: number
  detail: string
}

export type Redemption = {
  id: number
  clientId: number
  date: string
  reward: string
  points: number
}

export type Reward = {
  id: number
  title: string
  points: number
  description: string
  active: boolean
}

export type Promotion = {
  id: number
  title: string
  description: string
  type: 'pointsMultiplier' | 'discount'
  value: number
  startDate: string
  endDate: string
  minRank: Rank
  active: boolean
}

export type LoyaltySettings = {
  bookstoreName: string
  address: string
  phone: string
  pointsMoneyAmount: number
  pointValue: number
  pointsExpirationMonths: number
  ranks: Record<Rank, { minPoints: number; benefit: string }>
}

export type Notification = {
  id: number
  clientId?: number
  title: string
  message: string
  type: 'promotion' | 'expiration' | 'rank' | 'reward' | 'security'
  date: string
  read: boolean
}

export type LoyaltyData = {
  users: User[]
  clients: Client[]
  purchases: Purchase[]
  redemptions: Redemption[]
  rewards: Reward[]
  promotions: Promotion[]
  notifications: Notification[]
  settings: LoyaltySettings
}

const storageKey = 'bookstore-loyalty-db-v2'
const apiBaseUrl = 'http://127.0.0.1:8787'
export const pointsPerPeso = 0.1

export const defaultSettings: LoyaltySettings = {
  bookstoreName: 'Libreria Veintidos Veintitres',
  address: 'Av. Siempre Viva 123',
  phone: '341 555 1000',
  pointsMoneyAmount: 10,
  pointValue: 1,
  pointsExpirationMonths: 12,
  ranks: {
    Bronce: { minPoints: 0, benefit: 'Acceso a promociones generales.' },
    Plata: { minPoints: 1000, benefit: 'Canjes anticipados y promos x2.' },
    Oro: { minPoints: 2500, benefit: 'Descuentos exclusivos y prioridad.' },
    Diamante: { minPoints: 5000, benefit: 'Beneficios VIP y regalos sorpresa.' },
  },
}

const rewards: Reward[] = [
  {
    id: 1,
    title: '10% en literatura',
    points: 450,
    description: 'Descuento para novelas, cuentos y poesia.',
    active: true,
  },
  {
    id: 2,
    title: 'Cuaderno premium',
    points: 700,
    description: 'Canje directo por cuaderno tapa dura.',
    active: true,
  },
  {
    id: 3,
    title: '$3500 de credito',
    points: 1200,
    description: 'Saldo para usar en cualquier compra.',
    active: true,
  },
  {
    id: 4,
    title: 'Marcadores artisticos',
    points: 900,
    description: 'Set de color para estudiantes y artistas.',
    active: true,
  },
]

const promotions: Promotion[] = [
  {
    id: 1,
    title: 'Semana del lector',
    description: 'Duplica puntos en compras de literatura y novedades.',
    type: 'pointsMultiplier',
    value: 2,
    startDate: today(),
    endDate: daysFromNow(14),
    minRank: 'Bronce',
    active: true,
  },
  {
    id: 2,
    title: 'Beneficio Oro',
    description: 'Descuento especial para clientes de rango Oro o superior.',
    type: 'discount',
    value: 15,
    startDate: today(),
    endDate: daysFromNow(30),
    minRank: 'Oro',
    active: true,
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
]

export function rankForPoints(points: number, settings = defaultSettings): Rank {
  if (points >= settings.ranks.Diamante.minPoints) return 'Diamante'
  if (points >= settings.ranks.Oro.minPoints) return 'Oro'
  if (points >= settings.ranks.Plata.minPoints) return 'Plata'
  return 'Bronce'
}

export function pointsForAmount(amount: number, settings = defaultSettings) {
  return Math.floor((amount / settings.pointsMoneyAmount) * settings.pointValue)
}

export function currency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

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

function daysFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function monthsFromNow(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

function rankWeight(rank: Rank) {
  return ['Bronce', 'Plata', 'Oro', 'Diamante'].indexOf(rank)
}

export function promotionApplies(promotion: Promotion, rank: Rank, date = today()) {
  return (
    promotion.active &&
    promotion.startDate <= date &&
    promotion.endDate >= date &&
    rankWeight(rank) >= rankWeight(promotion.minRank)
  )
}

export function bestPointsPromotion(promotionsList: Promotion[], rank: Rank) {
  return promotionsList
    .filter(
      (promotion) =>
        promotion.type === 'pointsMultiplier' &&
        promotionApplies(promotion, rank),
    )
    .sort((a, b) => b.value - a.value)[0]
}

export function hashPassword(password: string) {
  return btoa(password).split('').reverse().join('')
}

export function createDemoData(clientCount = 24): LoyaltyData {
  const clients: Client[] = []
  const purchases: Purchase[] = []
  const redemptions: Redemption[] = []
  const users: User[] = [
    {
      id: 1,
      name: 'Dueno Libreria',
      email: 'admin@libreria.com',
      passwordHash: hashPassword('admin123'),
      role: 'owner',
      active: true,
    },
    {
      id: 2,
      name: 'Vendedor Mostrador',
      email: 'vendedor@libreria.com',
      passwordHash: hashPassword('vender123'),
      role: 'seller',
      active: true,
    },
  ]
  let purchaseId = 1
  let redemptionId = 1

  for (let index = 0; index < clientCount; index += 1) {
    const firstName = firstNames[index % firstNames.length]
    const lastName = lastNames[(index * 3) % lastNames.length]
    const client: Client = {
      id: index + 1,
      name: `${firstName} ${lastName}`,
      dni: `${28000000 + index * 731}`,
      phone: `341 555 ${String(1000 + index * 37).slice(-4)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      points: 0,
      rank: 'Bronce',
      pointsExpireAt: monthsFromNow(defaultSettings.pointsExpirationMonths),
    }

    const purchaseCount = randomNumber(2, 7)
    for (
      let purchaseIndex = 0;
      purchaseIndex < purchaseCount;
      purchaseIndex += 1
    ) {
      const amount = randomNumber(45, 360) * 100
      const points = pointsForAmount(amount)
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

    if (client.points >= rewards[0].points && index % 3 !== 1) {
      const redemptionCount = randomNumber(1, 2)
      for (
        let redemptionIndex = 0;
        redemptionIndex < redemptionCount;
        redemptionIndex += 1
      ) {
        const availableRewards = rewards.filter(
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

    client.rank = rankForPoints(client.points)
    clients.push(client)
    users.push({
      id: users.length + 1,
      name: client.name,
      email: client.email,
      passwordHash: hashPassword('cliente123'),
      role: 'client',
      clientId: client.id,
      active: true,
    })
  }

  return {
    users,
    clients,
    purchases: purchases.sort((a, b) => b.date.localeCompare(a.date)),
    redemptions: redemptions.sort((a, b) => b.date.localeCompare(a.date)),
    rewards,
    promotions,
    notifications: [
      {
        id: 1,
        title: 'Nueva promocion activa',
        message: 'Semana del lector duplica puntos en compras seleccionadas.',
        type: 'promotion',
        date: today(),
        read: false,
      },
      {
        id: 2,
        title: 'Canje disponible',
        message: 'Ya podes revisar premios y beneficios para tu rango.',
        type: 'reward',
        date: today(),
        read: false,
      },
    ],
    settings: defaultSettings,
  }
}

export function loadData() {
  const saved = localStorage.getItem(storageKey)
  if (!saved) {
    const data = createDemoData()
    saveData(data)
    return data
  }

  let data: LoyaltyData
  try {
    data = JSON.parse(saved) as LoyaltyData
  } catch {
    const demoData = createDemoData()
    saveData(demoData)
    return demoData
  }

  if (!data.clients?.length || !data.users?.length) {
    const demoData = createDemoData()
    saveData(demoData)
    return demoData
  }

  const migratedData: LoyaltyData = {
    ...data,
    rewards: (data.rewards || rewards).map((reward) => ({
      ...reward,
      active: reward.active ?? true,
    })),
    promotions: data.promotions || promotions,
    notifications: data.notifications || [],
    settings: data.settings || defaultSettings,
    clients: data.clients.map((client, index) => ({
      ...client,
      dni: client.dni || `${28000000 + index * 731}`,
      pointsExpireAt:
        client.pointsExpireAt ||
        monthsFromNow(
          (data.settings || defaultSettings).pointsExpirationMonths,
        ),
      rank: rankForPoints(client.points, data.settings || defaultSettings),
    })),
    users: data.users.map((user) => ({
      ...user,
      passwordHash: user.passwordHash || hashPassword(user.password || ''),
    })),
  }

  saveData(migratedData)
  return migratedData
}

export function saveData(data: LoyaltyData) {
  localStorage.setItem(storageKey, JSON.stringify(data))
  void saveServerData(data)
}

export async function fetchServerData() {
  if (window.location.hostname.endsWith('github.io')) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/api/data`)
  if (!response.ok) {
    throw new Error('No se pudo leer la base compartida.')
  }
  const payload = (await response.json()) as { data: LoyaltyData | null }
  return payload.data
}

export async function saveServerData(data: LoyaltyData) {
  if (window.location.hostname.endsWith('github.io')) {
    return
  }

  try {
    await fetch(`${apiBaseUrl}/api/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    // The desktop demo keeps working with localStorage if the API is offline.
  }
}

export async function syncFromServer() {
  const serverData = await fetchServerData()
  if (!serverData) {
    const localData = loadData()
    await saveServerData(localData)
    return localData
  }

  localStorage.setItem(storageKey, JSON.stringify(serverData))
  return loadData()
}

export function authenticate(data: LoyaltyData, identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const normalizedDigits = identifier.replace(/\D/g, '')
  return data.users.find(
    (user) => {
      const client = data.clients.find((item) => item.id === user.clientId)
      const matchesIdentifier =
        user.email.toLowerCase() === normalizedIdentifier ||
        client?.email.toLowerCase() === normalizedIdentifier ||
        client?.phone.replace(/\D/g, '') === normalizedDigits ||
        client?.dni.replace(/\D/g, '') === normalizedDigits

      return (
        user.active &&
        matchesIdentifier &&
        (user.passwordHash || hashPassword(user.password || '')) ===
          hashPassword(password)
      )
    },
  )
}

export function nextId(items: Array<{ id: number }>) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1
}
