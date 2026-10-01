# Pruebas en dispositivos físicos (M6)

Hazlas con un APK de `Android release` (o `./gradlew assembleDebug`) en al menos: un Android de gama media
(4 GB RAM, Android 11–12), un Android reciente (14–15, gestos) y un teléfono pequeño (≤ 5.8").

## Instalación y arranque

- [ ] Splash tinta con punto lima (Android 12+ y anteriores), sin destello blanco.
- [ ] Icono adaptativo correcto en el launcher (círculo, squircle).
- [ ] Barra de estado: iconos oscuros en pantallas papel; claros en Diario, Mi historia, Ministerios, Llamados,
      Conferencia, Mentoría y Bellas Artes. Nada tapado por la cámara/notch ni por la barra de gestos.
- [ ] Botón atrás: retrocede; en una pestaña raíz sale de la app.

## Cuenta y datos

- [ ] Registro, verificación de correo, entrar, Google (navegador interno → vuelve a la app).
- [ ] Unirse a la iglesia con QR (permiso de cámara solo al tocar "Escanear").
- [ ] Diario sin conexión (modo avión) → vuelve la señal → se sincroniza.
- [ ] Biblia: capítulos ya leídos abren sin conexión.

## Avisos

- [ ] No se pide permiso de notificaciones al abrir la app.
- [ ] Perfil → Avisos → activar push → aparece el diálogo del sistema → aceptar.
- [ ] Mensaje del mentor desde otra cuenta → llega push "X te escribió · Abre Camino para verlo." (sin el texto).
- [ ] Tocar el push abre la conversación correcta.
- [ ] En horario de descanso no llega push; el aviso sí aparece en `/avisos`.
- [ ] Recordatorio amable a la hora elegida; tocarlo abre Inicio. Desactivarlo lo cancela.
- [ ] Reiniciar el teléfono: el recordatorio sigue programado.

## Enlaces

- [ ] `camino://events/<id>` (adb: `adb shell am start -a android.intent.action.VIEW -d "camino://events/<id>"`).
- [ ] App Link `https://<dominio>/evento/?id=<id>` abre la app (tras publicar `assetlinks.json`):
      `adb shell pm get-app-links app.camino` debe mostrar `verified`.
- [ ] Compartir evento / versículo abre la hoja nativa.

## Rendimiento y accesibilidad

- [ ] Inicio carga en < 2 s en gama media con datos móviles.
- [ ] Texto del sistema al 130%: nada se corta en Inicio, Devocional, Biblia, Avisos.
- [ ] TalkBack: botones con nombre (campana, cerrar, enviar), interruptores anuncian estado.
