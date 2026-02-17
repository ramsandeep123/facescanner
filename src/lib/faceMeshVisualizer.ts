/**
 * Face Mesh Visualization Utility
 * Provides tools to visualize MediaPipe's 478-point face mesh
 */

export interface VisualizationOptions {
    showAllPoints?: boolean;
    showKeyPoints?: boolean;
    showConnections?: boolean;
    pointColor?: string;
    keyPointColor?: string;
    connectionColor?: string;
    pointSize?: number;
    keyPointSize?: number;
    lineWidth?: number;
}

// Key landmark indices for face shape analysis
export const KEY_LANDMARKS = {
    // Forehead
    foreheadLeft: 21,
    foreheadRight: 251,
    foreheadCenter: 10,

    // Cheekbones
    cheekboneLeft: 234,
    cheekboneRight: 454,

    // Jaw
    jawLeft: 172,
    jawRight: 397,
    jawAngleAboveLeft: 132,
    jawAngleAboveRight: 361,

    // Chin
    chin: 152,
    chinLeft: 149,
    chinRight: 378,

    // Eyes
    leftEyeOuter: 33,
    leftEyeInner: 133,
    rightEyeOuter: 263,
    rightEyeInner: 362,

    // Nose
    noseBridge: 6,
    noseBottom: 4,
};

// Face mesh connections for visualization (simplified version)
export const FACE_CONNECTIONS = [
    // Face oval
    [10, 338], [338, 297], [297, 332], [332, 284],
    [284, 251], [251, 389], [389, 356], [356, 454],
    [454, 323], [323, 361], [361, 288], [288, 397],
    [397, 365], [365, 379], [379, 378], [378, 400],
    [400, 377], [377, 152], [152, 148], [148, 176],
    [176, 149], [149, 150], [150, 136], [136, 172],
    [172, 58], [58, 132], [132, 93], [93, 234],
    [234, 127], [127, 162], [162, 21], [21, 54],
    [54, 103], [103, 67], [67, 109], [109, 10],

    // Left eye
    [33, 246], [246, 161], [161, 160], [160, 159],
    [159, 158], [158, 157], [157, 173], [173, 133],
    [133, 155], [155, 154], [154, 153], [153, 145],
    [145, 144], [144, 163], [163, 7], [7, 33],

    // Right eye
    [263, 466], [466, 388], [388, 387], [387, 386],
    [386, 385], [385, 384], [384, 398], [398, 362],
    [362, 382], [382, 381], [381, 380], [380, 374],
    [374, 373], [373, 390], [390, 249], [249, 263],

    // Nose
    [168, 6], [6, 197], [197, 195], [195, 5],
    [5, 4], [4, 1], [1, 19], [19, 94],

    // Lips outer
    [61, 146], [146, 91], [91, 181], [181, 84],
    [84, 17], [17, 314], [314, 405], [405, 321],
    [321, 375], [375, 291], [291, 61],
];

/**
 * Draw face mesh on canvas
 */
export function drawFaceMesh(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number }[],
    options: VisualizationOptions = {}
): void {
    const {
        showAllPoints = false,
        showKeyPoints = true,
        showConnections = true,
        pointColor = '#00ff00',
        keyPointColor = '#ff0000',
        connectionColor = '#00ff0088',
        pointSize = 1,
        keyPointSize = 3,
        lineWidth = 1,
    } = options;

    // Draw connections
    if (showConnections) {
        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = lineWidth;

        for (const [start, end] of FACE_CONNECTIONS) {
            if (landmarks[start] && landmarks[end]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[start].x, landmarks[start].y);
                ctx.lineTo(landmarks[end].x, landmarks[end].y);
                ctx.stroke();
            }
        }
    }

    // Draw all points
    if (showAllPoints) {
        ctx.fillStyle = pointColor;
        for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Draw key points
    if (showKeyPoints) {
        ctx.fillStyle = keyPointColor;
        const keyIndices = Object.values(KEY_LANDMARKS);

        for (const index of keyIndices) {
            if (landmarks[index]) {
                ctx.beginPath();
                ctx.arc(landmarks[index].x, landmarks[index].y, keyPointSize, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }
}

/**
 * Draw measurement lines between key landmarks
 */
export function drawMeasurementLines(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number }[],
    measurements: {
        foreheadWidth?: boolean;
        cheekboneWidth?: boolean;
        jawWidth?: boolean;
        faceLength?: boolean;
    } = {}
): void {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (measurements.foreheadWidth) {
        const left = landmarks[KEY_LANDMARKS.foreheadLeft];
        const right = landmarks[KEY_LANDMARKS.foreheadRight];
        if (left && right) {
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }
    }

    if (measurements.cheekboneWidth) {
        const left = landmarks[KEY_LANDMARKS.cheekboneLeft];
        const right = landmarks[KEY_LANDMARKS.cheekboneRight];
        if (left && right) {
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }
    }

    if (measurements.jawWidth) {
        const left = landmarks[KEY_LANDMARKS.jawLeft];
        const right = landmarks[KEY_LANDMARKS.jawRight];
        if (left && right) {
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }
    }

    if (measurements.faceLength) {
        const top = landmarks[KEY_LANDMARKS.foreheadCenter];
        const bottom = landmarks[KEY_LANDMARKS.chin];
        if (top && bottom) {
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.stroke();
        }
    }

    ctx.setLineDash([]);
}

/**
 * Draw confidence visualization
 */
export function drawConfidenceIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    confidence: number,
    label: string
): void {
    const barWidth = 100;
    const barHeight = 10;

    // Background
    ctx.fillStyle = '#00000088';
    ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 30);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, x, y - 8);

    // Bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Bar fill
    const fillWidth = (confidence / 100) * barWidth;
    const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);

    if (confidence >= 70) {
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#00cc00');
    } else if (confidence >= 50) {
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#cccc00');
    } else {
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#cc0000');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, fillWidth, barHeight);

    // Percentage text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${confidence}%`, x + barWidth + 5, y + 8);
}
