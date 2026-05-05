import { copyFile } from 'node:fs/promises'

await copyFile('dist/client.html', 'dist/index.html')
