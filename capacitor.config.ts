import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.puntolector.fidelizacion',
  appName: 'Punto Lector',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
