import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  descriptor: Float32Array;
}

export async function detectFaces(imageSrc: string): Promise<DetectedFace[]> {
  if (!modelsLoaded) {
    throw new Error('Face API models not loaded. Call loadFaceApiModels() first.');
  }

  const img = await faceapi.fetchImage(imageSrc);
  const detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  const imgWidth = img.width;
  const imgHeight = img.height;

  return detections.map((d) => {
    const box = d.detection.box;
    return {
      x: Math.max(0, Math.min(1, box.x / imgWidth)),
      y: Math.max(0, Math.min(1, box.y / imgHeight)),
      width: Math.max(0, Math.min(1, box.width / imgWidth)),
      height: Math.max(0, Math.min(1, box.height / imgHeight)),
      descriptor: d.descriptor,
    };
  });
}

export function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  return faceapi.euclideanDistance(a, b);
}
