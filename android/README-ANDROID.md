# Guyunusa Android — Capacitor 6

## Requisitos previos
- Node.js 18+
- Android Studio (Hedgehog o superior)
- Android SDK 24+ (Android 7.0 mínimo)
- Java JDK 17

## Instalación inicial (una sola vez)

```bash
# 1. Instalar dependencias de Capacitor
cd android
npm install

# 2. Inicializar Capacitor en la raíz del proyecto
npx cap init "Guyunusa" "uy.guyunusa.app" --web-dir ../frontend

# 3. Agregar la plataforma Android
npx cap add android

# 4. Sincronizar el frontend con el proyecto Android
npx cap sync android
```

## Flujo de trabajo diario

```bash
# Después de cambiar código del frontend:
cd android
npx cap sync android

# Abrir Android Studio para compilar/testear:
npx cap open android

# O correr directamente en dispositivo/emulador:
npx cap run android
```

## Estructura generada por Capacitor

```
android/
├── capacitor.config.json   ← configuración principal
├── package.json
├── android/                ← proyecto Android Studio (generado)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/uy/guyunusa/app/
│   │   │   │   └── MainActivity.java
│   │   │   ├── res/
│   │   │   │   ├── drawable/      ← íconos y splash
│   │   │   │   ├── values/        ← colores y strings
│   │   │   │   └── xml/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
└── node_modules/
```

## Recursos gráficos necesarios

Crear en `android/app/src/main/res/`:

| Recurso       | Tamaño         | Carpeta              |
|---------------|----------------|----------------------|
| Ícono mdpi    | 48×48 px       | `drawable-mdpi/`     |
| Ícono hdpi    | 72×72 px       | `drawable-hdpi/`     |
| Ícono xhdpi   | 96×96 px       | `drawable-xhdpi/`    |
| Ícono xxhdpi  | 144×144 px     | `drawable-xxhdpi/`   |
| Ícono xxxhdpi | 192×192 px     | `drawable-xxxhdpi/`  |
| Splash        | 2732×2732 px   | `drawable/`          |

Herramienta recomendada: **Android Asset Studio**
https://romannurik.github.io/AndroidAssetStudio/

## Build de release (APK / AAB para Play Store)

```bash
# 1. Generar keystore (una sola vez)
keytool -genkey -v \
  -keystore guyunusa-release.keystore \
  -alias guyunusa \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# 2. En Android Studio:
#    Build → Generate Signed Bundle / APK
#    Elegir Android App Bundle (.aab) para Play Store

# 3. O desde línea de comandos:
cd android/android
./gradlew bundleRelease
# El .aab queda en: app/build/outputs/bundle/release/
```

## Variables de entorno para la API

En producción, el frontend apunta a `https://api.guyunusa.uy`.
En desarrollo, Capacitor puede usar el servidor local:

```json
// capacitor.config.json — SOLO para desarrollo local
"server": {
  "url": "http://192.168.1.X:3000",
  "cleartext": true
}
```
Revertir antes de hacer build de release.
