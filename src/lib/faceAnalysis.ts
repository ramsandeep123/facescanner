import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export const LANDMARKS = {
  foreheadLeft: 21,
  foreheadRight: 251,

  cheekboneLeft: 234,
  cheekboneRight: 454,

  jawLeft: 172,
  jawRight: 397,

  chin: 152,
  chinLeft: 149,
  chinRight: 378,

  jawAngleAboveLeft: 132,
  jawAngleAboveRight: 361,

  leftEyeCenter: 468,
  rightEyeCenter: 473,

  leftEyeOuter: 33,
  leftEyeInner: 133,
  leftEyeTop: 159,
  leftEyeBottom: 145,

  rightEyeOuter: 263,
  rightEyeInner: 362,
  rightEyeTop: 386,
  rightEyeBottom: 374,

  noseBridge: 6,

  faceOvalTop: 10,
};

export interface FaceLandmarks {
  keypoints: { x: number; y: number }[];
  eyeCenter: { x: number; y: number };
  eyeWidth: number;
  faceWidth: number;
  faceAngle: number;
  leftEye: { x: number; y: number; width: number; height: number };
  rightEye: { x: number; y: number; width: number; height: number };
  noseBridge: { x: number; y: number };
}

export interface FaceAnalysisResult {
  faceShapeId: string;
  confidence: number;
  allScores: { shapeId: string; score: number }[];
  measurements: {
    faceLength: number;
    faceWidth: number;
    foreheadWidth: number;
    cheekboneWidth: number;
    jawWidth: number;
    chinWidth: number;
    lengthToWidthRatio: number;
    foreheadToJawRatio: number;
    cheekboneProminence: number;
    chinToJawRatio: number;
    jawAngle: number;
  };
  landmarks: FaceLandmarks;
  confidenceFactors: {
    measurementQuality: number;
    symmetry: number;
    landmarkStability: number;
    overallConfidence: number;
  };
}

export interface FaceDetectionError {
  type: 'no-face' | 'multiple-faces' | 'poor-quality' | 'model-error';
  message: string;
}

let faceLandmarker: FaceLandmarker | null = null;
let modelsLoaded = false;

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function initializeFaceDetector(): Promise<void> {
  if (modelsLoaded) return;

  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

  try {
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
    });
  } catch {
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
    });
  }

  modelsLoaded = true;
}

export function isModelReady(): boolean {
  return modelsLoaded;
}

export function disposeModel(): void {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
  modelsLoaded = false;
}

function calculateDistance(p1: any, p2: any): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function calculateAngle(A: any, B: any, C: any): number {
  const BA = { x: A.x - B.x, y: A.y - B.y };
  const BC = { x: C.x - B.x, y: C.y - B.y };

  const dot = BA.x * BC.x + BA.y * BC.y;
  const magBA = Math.hypot(BA.x, BA.y);
  const magBC = Math.hypot(BC.x, BC.y);

  return Math.acos(dot / (magBA * magBC)) * (180 / Math.PI);
}

function normalize(value: number, ipd: number): number {
  return value / ipd;
}

/* ---------- EMA SMOOTHING ---------- */

let previousMeasurements: any = null;

function smoothValue(prev: number, current: number, alpha = 0.3) {
  return prev * (1 - alpha) + current * alpha;
}

function smoothMeasurements(current: any) {
  if (!previousMeasurements) {
    previousMeasurements = current;
    return current;
  }

  const smoothed = { ...current };

  Object.keys(current).forEach(key => {
    if (typeof current[key] === 'number') {
      smoothed[key] = smoothValue(previousMeasurements[key], current[key]);
    }
  });

  previousMeasurements = smoothed;
  return smoothed;
}

/* ---------- CONFIDENCE FACTORS ---------- */

function calculateConfidenceFactors(landmarks: any[], measurements: any, faceAngle: number) {
  let measurementQuality = 1.0;

  if (measurements.lengthToWidthRatio < 0.9 || measurements.lengthToWidthRatio > 1.8)
    measurementQuality *= 0.75;

  if (measurements.jawAngle < 110 || measurements.jawAngle > 170)
    measurementQuality *= 0.85;

  const MAX_ROTATION = 0.25;
  if (Math.abs(faceAngle) > MAX_ROTATION)
    measurementQuality *= 0.75;

  const leftEyeWidth = calculateDistance(landmarks[33], landmarks[133]);
  const rightEyeWidth = calculateDistance(landmarks[263], landmarks[362]);

  const eyeSymmetry = 1 - Math.abs(leftEyeWidth - rightEyeWidth) / Math.max(leftEyeWidth, rightEyeWidth);

  const stabilityIndices = [10, 152, 234, 454];
  const zValues = stabilityIndices.map(i => landmarks[i].z);
  const avgZ = zValues.reduce((a, b) => a + b) / zValues.length;
  const variance = zValues.reduce((sum, z) => sum + (z - avgZ) ** 2, 0) / zValues.length;

  const landmarkStability = Math.max(0, 1 - variance * 15);

  const overallConfidence =
    measurementQuality * 0.4 +
    eyeSymmetry * 0.4 +
    landmarkStability * 0.2;

  return {
    measurementQuality: +measurementQuality.toFixed(2),
    symmetry: +eyeSymmetry.toFixed(2),
    landmarkStability: +landmarkStability.toFixed(2),
    overallConfidence: +overallConfidence.toFixed(2),
  };
}

/* ---------- CLASSIFICATION ---------- */

function classifyFaceShape(
  measurements: any,
  symmetryScore: number = 1.0
): {
  shapeId: string;
  confidence: number;
  allScores: { shapeId: string; score: number }[];
} {
  const {
    lengthToWidthRatio,
    foreheadToJawRatio,
    cheekboneProminence,
    chinToJawRatio,
    jawAngle,
    foreheadWidth,
    cheekboneWidth,
    jawWidth,
  } = measurements;

  const foreheadToCheekRatio = foreheadWidth / cheekboneWidth;
  const jawToCheekRatio = jawWidth / cheekboneWidth;
  const widthVariance = Math.abs(foreheadWidth - jawWidth) / cheekboneWidth;

  const scores: Record<string, number> = {};

  // OVAL
  let s = 0;
  if (lengthToWidthRatio >= 1.15 && lengthToWidthRatio <= 1.22) s += 30;
  else if (lengthToWidthRatio >= 1.10 && lengthToWidthRatio <= 1.27) s += 20;
  if (jawAngle >= 133 && jawAngle <= 145) s += 25;
  else if (jawAngle >= 130 && jawAngle <= 150) s += 15;
  if (widthVariance < 0.10) s += 25;
  else if (widthVariance < 0.15) s += 15;
  if (foreheadToJawRatio >= 1.0 && foreheadToJawRatio <= 1.15) s += 20;
  else if (foreheadToJawRatio >= 0.95 && foreheadToJawRatio <= 1.20) s += 10;
  scores.oval = s;

  // ROUND
  s = 0;
  if (lengthToWidthRatio >= 0.95 && lengthToWidthRatio <= 1.12) s += 35;
  else if (lengthToWidthRatio >= 0.90 && lengthToWidthRatio <= 1.15) s += 20;
  if (jawAngle > 145) s += 30;
  else if (jawAngle > 140) s += 20;
  else if (jawAngle > 135) s += 10;
  if (widthVariance < 0.08) s += 20;
  else if (widthVariance < 0.12) s += 10;
  if (cheekboneProminence >= 1.0 && cheekboneProminence <= 1.10) s += 15;
  scores.round = s;

  // SQUARE
  s = 0;
  if (lengthToWidthRatio >= 1.0 && lengthToWidthRatio <= 1.15) s += 25;
  else if (lengthToWidthRatio >= 0.95 && lengthToWidthRatio <= 1.20) s += 15;
  if (jawAngle < 125) s += 35;
  else if (jawAngle < 130) s += 25;
  else if (jawAngle < 133) s += 15;
  if (widthVariance < 0.10) s += 25;
  else if (widthVariance < 0.15) s += 15;
  if (jawToCheekRatio > 0.85) s += 15;
  else if (jawToCheekRatio > 0.78) s += 10;
  scores.square = s;

  // HEART
  s = 0;
  if (foreheadToJawRatio > 1.25) s += 40;
  else if (foreheadToJawRatio > 1.18) s += 30;
  else if (foreheadToJawRatio > 1.12) s += 20;
  if (jawToCheekRatio < 0.75) s += 30;
  else if (jawToCheekRatio < 0.82) s += 20;
  if (chinToJawRatio < 0.75) s += 20;
  else if (chinToJawRatio < 0.85) s += 10;
  if (lengthToWidthRatio < 1.25) s += 10;
  scores.heart = s;

  // OBLONG
  s = 0;
  if (lengthToWidthRatio > 1.30) s += 40;
  else if (lengthToWidthRatio > 1.25) s += 30;
  else if (lengthToWidthRatio > 1.20) s += 20;
  if (jawAngle > 135) s += 25;
  else if (jawAngle > 130) s += 15;
  if (widthVariance < 0.12) s += 20;
  else if (widthVariance < 0.18) s += 10;
  if (foreheadToCheekRatio >= 0.90 && foreheadToCheekRatio <= 1.10) s += 15;
  scores.oblong = s;

  // DIAMOND
  s = 0;
  if (foreheadToCheekRatio < 0.90) s += 35;
  else if (foreheadToCheekRatio < 0.95) s += 25;
  else if (foreheadToCheekRatio < 1.0) s += 15;
  if (jawToCheekRatio < 0.70) s += 35;
  else if (jawToCheekRatio < 0.78) s += 25;
  else if (jawToCheekRatio < 0.85) s += 15;
  if (cheekboneProminence > 1.10) s += 20;
  else if (cheekboneProminence > 1.05) s += 10;
  if (jawAngle < 140) s += 10;
  scores.diamond = s;

  // RECTANGLE
  s = 0;
  if (lengthToWidthRatio > 1.30) s += 35;
  else if (lengthToWidthRatio > 1.25) s += 25;
  else if (lengthToWidthRatio > 1.20) s += 15;
  if (jawAngle < 125) s += 35;
  else if (jawAngle < 130) s += 25;
  else if (jawAngle < 133) s += 15;
  if (widthVariance < 0.12) s += 20;
  else if (widthVariance < 0.18) s += 10;
  if (jawToCheekRatio > 0.82) s += 10;
  scores.rectangle = s;

  // Apply symmetry
  Object.keys(scores).forEach(k => {
    scores[k] *= 0.7 + symmetryScore * 0.3;
  });

  const allScores = Object.entries(scores)
    .map(([shapeId, score]) => ({ shapeId, score: Math.round(score) }))
    .sort((a, b) => b.score - a.score);

  const winner = allScores[0];
  const runnerUp = allScores[1];
  const scoreGap = winner.score - runnerUp.score;

  let confidence = winner.score;
  if (scoreGap > 20) confidence = Math.min(100, confidence + 10);
  else if (scoreGap < 10) confidence = Math.max(50, confidence - 10);

  return {
    shapeId: winner.shapeId,
    confidence,
    allScores,
  };
}

/* ---------- ANALYZE FACE ---------- */

export async function analyzeFace(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  isWebcam = false
): Promise<FaceAnalysisResult> {
  if (!faceLandmarker || !modelsLoaded) {
    throw { type: 'model-error', message: 'Model not ready' } as FaceDetectionError;
  }

  const width =
    imageElement instanceof HTMLVideoElement
      ? imageElement.videoWidth
      : imageElement instanceof HTMLImageElement
        ? imageElement.naturalWidth
        : imageElement.width;

  const height =
    imageElement instanceof HTMLVideoElement
      ? imageElement.videoHeight
      : imageElement instanceof HTMLImageElement
        ? imageElement.naturalHeight
        : imageElement.height;

  const result = faceLandmarker.detect(imageElement);

  if (!result.faceLandmarks?.length) {
    throw { type: 'no-face', message: 'No face detected' } as FaceDetectionError;
  }

  const landmarks = result.faceLandmarks[0];

  const getPoint = (i: number) => ({
    x: landmarks[i].x * width,
    y: landmarks[i].y * height,
  });

  const foreheadWidth = calculateDistance(getPoint(21), getPoint(251));
  const cheekboneWidth = calculateDistance(getPoint(234), getPoint(454));
  const jawWidth = calculateDistance(getPoint(172), getPoint(397));
  const chinWidth = calculateDistance(getPoint(149), getPoint(378));
  const faceLength = calculateDistance(getPoint(10), getPoint(152));

  // ✅ Correct face width
  const faceWidth = cheekboneWidth;

  const leftEyeCenter = getPoint(468);
  const rightEyeCenter = getPoint(473);
  const ipd = calculateDistance(leftEyeCenter, rightEyeCenter);

  const leftJawAngle = calculateAngle(getPoint(132), getPoint(172), getPoint(152));
  const rightJawAngle = calculateAngle(getPoint(361), getPoint(397), getPoint(152));
  const jawAngle = (leftJawAngle + rightJawAngle) / 2;

  const rawMeasurements = {
    faceLength: normalize(faceLength, ipd),
    faceWidth: normalize(faceWidth, ipd),
    foreheadWidth: normalize(foreheadWidth, ipd),
    cheekboneWidth: normalize(cheekboneWidth, ipd),
    jawWidth: normalize(jawWidth, ipd),
    chinWidth: normalize(chinWidth, ipd),

    lengthToWidthRatio: faceLength / faceWidth,
    foreheadToJawRatio: foreheadWidth / jawWidth,
    cheekboneProminence: cheekboneWidth / ((foreheadWidth + jawWidth) / 2),
    chinToJawRatio: chinWidth / jawWidth,
    jawAngle,
  };

  const measurements = isWebcam
    ? smoothMeasurements(rawMeasurements)
    : rawMeasurements;

  const faceAngle = Math.atan2(
    rightEyeCenter.y - leftEyeCenter.y,
    rightEyeCenter.x - leftEyeCenter.x
  );

  const confidenceFactors = calculateConfidenceFactors(landmarks, measurements, faceAngle);

  // Call classification function
  const classification = classifyFaceShape(measurements, confidenceFactors.symmetry);


  return {
    faceShapeId: classification.shapeId,
    confidence: classification.confidence,
    allScores: classification.allScores,
    measurements,
    landmarks: extractFaceLandmarks(landmarks, width, height),
    confidenceFactors,
  };
}

/* ---------- EXTRACT LANDMARKS ---------- */

function extractFaceLandmarks(landmarks: any[], width: number, height: number): FaceLandmarks {
  const get = (i: number) => ({
    x: landmarks[i].x * width,
    y: landmarks[i].y * height,
  });

  const leftEyeOuter = get(33);
  const leftEyeInner = get(133);
  const leftEyeTop = get(159);
  const leftEyeBottom = get(145);

  const rightEyeOuter = get(263);
  const rightEyeInner = get(362);
  const rightEyeTop = get(386);
  const rightEyeBottom = get(374);

  const leftEyeWidth = calculateDistance(leftEyeOuter, leftEyeInner);
  const rightEyeWidth = calculateDistance(rightEyeOuter, rightEyeInner);

  const leftEyeCenter = {
    x: (leftEyeOuter.x + leftEyeInner.x) / 2,
    y: (leftEyeTop.y + leftEyeBottom.y) / 2,
  };

  const rightEyeCenter = {
    x: (rightEyeOuter.x + rightEyeInner.x) / 2,
    y: (rightEyeTop.y + rightEyeBottom.y) / 2,
  };

  return {
    keypoints: landmarks.map(l => ({
      x: l.x * width,
      y: l.y * height,
    })),
    eyeCenter: {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    },
    eyeWidth: calculateDistance(leftEyeOuter, rightEyeOuter),
    faceWidth: calculateDistance(get(234), get(454)),
    faceAngle: Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x
    ),
    leftEye: { ...leftEyeCenter, width: leftEyeWidth, height: calculateDistance(leftEyeTop, leftEyeBottom) },
    rightEye: { ...rightEyeCenter, width: rightEyeWidth, height: calculateDistance(rightEyeTop, rightEyeBottom) },
    noseBridge: get(6),
  };
}
