import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(rootDir, 'data')
const dbPath = join(dataDir, 'loyalty-db.json')
const port = Number(process.env.PORT || 8787)

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : null
}

async function readDatabase() {
  try {
    const content = await readFile(dbPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function writeDatabase(data) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {})
      return
    }

    if (request.url === '/api/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.url === '/api/data' && request.method === 'GET') {
      sendJson(response, 200, { data: await readDatabase() })
      return
    }

    if (request.url === '/api/data' && request.method === 'PUT') {
      const data = await readJsonBody(request)
      await writeDatabase(data)
      sendJson(response, 200, { ok: true })
      return
    }

    sendJson(response, 404, { error: 'Not found' })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Loyalty API listening on http://127.0.0.1:${port}`)
})
