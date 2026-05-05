export type Role = 'owner' | 'seller' | 'client'

export type Rank = 'Bronce' | 'Plata' | 'Oro' | 'Diamante'

export type User = {
  id: number
  name: string
  email: string
  password: string
  role: Role
  clientId?: number
  active: boolean
}

export type Client = {
  id: number
  name: string
  phone: string
  email: string
  points: number
  rank: Rank
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

export type LoyaltyData = {
  users: User[]
  clients: Client[]
  purchases: Purchase[]
  redemptions: Redemption[]
  rewards: Reward[]
  promotions: Promotion[]
}

const storageKey = 'bookstore-loyalty-db-v2'
export const pointsPerPeso = 0.1

const rewards: Reward[] = [
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

export function rankForPoints(points: number): Rank {
  if (points >= 5000) return 'Diamante'
  if (points >= 2500) return 'Oro'
  if (points >= 1000) return 'Plata'
  return 'Bronce'
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

export function createDemoData(clientCount = 24): LoyaltyData {
  const clients: Client[] = []
  const purchases: Purchase[] = []
  const redemptions: Redemption[] = []
  const users: User[] = [
    {
      id: 1,
      name: 'Dueno Libreria',
      email: 'admin@libreria.com',
      password: 'admin123',
      role: 'owner',
      active: true,
    },
    {
      id: 2,
      name: 'Vendedor Mostrador',
      email: 'vendedor@libreria.com',
      password: 'vender123',
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
      phone: `341 555 ${String(1000 + index * 37).slice(-4)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      points: 0,
      rank: 'Bronce',
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
      password: 'cliente123',
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
  }
}

export function loadData() {
  const saved = localStorage.getItem(storageKey)
  if (!saved) {
    const data = createDemoData()
    saveData(data)
    return data
  }

  const data = JSON.parse(saved) as LoyaltyData
  if (!data.promotions) {
    const migratedData = { ...data, promotions }
    saveData(migratedData)
    return migratedData
  }

  return data
}

export function saveData(data: LoyaltyData) {
  localStorage.setItem(storageKey, JSON.stringify(data))
}

export function authenticate(data: LoyaltyData, email: string, password: string) {
  return data.users.find(
    (user) =>
      user.active &&
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password,
  )
}

export function nextId(items: Array<{ id: number }>) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1
}
