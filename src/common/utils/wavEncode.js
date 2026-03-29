function writeString(dataView, offset, string) {
    for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Fade in/out at chunk edges so concatenated WAV PCM does not click at splices.
 * @param {Float32Array} samples
 * @param {{ fadeIn?: boolean, fadeOut?: boolean }} edges
 * @param {number} fadeLen
 * @returns {Float32Array}
 */
export function applyMonoChunkBoundaryFades(samples, edges, fadeLen = 512) {
    const n = samples.length;
    if (n === 0) return new Float32Array(0);
    const out = new Float32Array(samples);
    const f = Math.min(fadeLen, Math.max(2, Math.floor(n / 4)));
    if (edges.fadeIn) {
        for (let k = 0; k < f; k++) {
            out[k] *= (k + 1) / f;
        }
    }
    if (edges.fadeOut) {
        for (let k = 0; k < f; k++) {
            out[n - f + k] *= (f - k) / f;
        }
    }
    return out;
}

/**
 * @param {Float32Array} samples Mono samples in [-1, 1]
 * @param {number} sampleRate
 * @returns {ArrayBuffer}
 */
export function float32MonoToWavArrayBuffer(samples, sampleRate) {
    const numChannels = 1;
    const sampleCount = samples.length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = sampleCount * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < sampleCount; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        const int16 = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
        view.setInt16(offset, Math.max(-32768, Math.min(32767, int16)), true);
        offset += 2;
    }

    return arrayBuffer;
}

/**
 * @param {AudioBuffer} buffer
 * @returns {ArrayBuffer} Full RIFF WAV (16-bit PCM LE, interleaved if stereo)
 */
export function audioBufferToWavArrayBuffer(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const samples = buffer.length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let c = 0; c < numChannels; c++) {
        channelData.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
        for (let c = 0; c < numChannels; c++) {
            const s = Math.max(-1, Math.min(1, channelData[c][i]));
            const int16 =
                s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
            view.setInt16(offset, Math.max(-32768, Math.min(32767, int16)), true);
            offset += 2;
        }
    }

    return arrayBuffer;
}

/**
 * Decode a MediaRecorder blob (e.g. WebM/Opus) and re-encode as WAV PCM.
 * @param {Blob} mediaBlob
 * @param {AudioContext} audioContext
 * @returns {Promise<ArrayBuffer>}
 */
export async function encodeMediaBlobToWav(mediaBlob, audioContext) {
    if (!audioContext || audioContext.state === 'closed') throw new Error("AudioContext is closed");
    const raw = await mediaBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(raw.slice(0));
    return audioBufferToWavArrayBuffer(audioBuffer);
}

/**
 * Convert WAV ArrayBuffer to byte array for API transmission
 * @param {ArrayBuffer} wavArrayBuffer
 * @returns {number[]}
 */
export function wavArrayBufferToByteArray(wavArrayBuffer) {
    return Array.from(new Uint8Array(wavArrayBuffer));
}
