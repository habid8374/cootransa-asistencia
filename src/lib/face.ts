import * as faceapi from 'face-api.js'

let loaded = false

/**
 * Carga los modelos de face-api.js desde /models (carpeta public).
 * Usa TinyFaceDetector (ligero, ideal para tablet) + landmarks + recognition.
 */
export async function loadModels(): Promise<void> {
  if (loaded) return
  const MODEL_URL = '/models'
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  loaded = true
}

// inputSize menor = reconocimiento más rápido. 224 es buen balance velocidad/precisión.
const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })

/**
 * Detecta un rostro en el elemento de video/imagen y devuelve su descriptor (128 floats),
 * o null si no detecta ninguno.
 */
export async function getDescriptor(
  input: HTMLVideoElement | HTMLImageElement
): Promise<Float32Array | null> {
  const result = await faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor()
  return result?.descriptor ?? null
}

/**
 * Compara un descriptor contra una lista de empleados y devuelve el mejor match
 * cuyo distancia euclidiana sea menor al umbral (0.5 = estricto, 0.6 = tolerante).
 */
export function matchDescriptor<T extends { descriptor?: number[] }>(
  descriptor: Float32Array,
  candidates: T[],
  threshold = 0.55
): { match: T; distance: number } | null {
  let best: { match: T; distance: number } | null = null
  for (const c of candidates) {
    if (!c.descriptor || c.descriptor.length !== 128) continue
    const dist = faceapi.euclideanDistance(descriptor, new Float32Array(c.descriptor))
    if (dist < threshold && (!best || dist < best.distance)) {
      best = { match: c, distance: dist }
    }
  }
  return best
}
