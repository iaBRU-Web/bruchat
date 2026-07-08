// Lightweight client-side media compression utilities
// Best-effort: gracefully falls back to the original file when browser APIs aren't supported.

export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Immediate (non-blocking) video "compression":
// The old implementation re-recorded the video in realtime via MediaRecorder,
// which forced users to wait the entire video duration before upload.
// True transcoding in-browser requires ffmpeg.wasm (multi-MB dependency).
// For now we return the original file instantly so uploads start right away.
export async function compressVideo(file: File, _maxDim = 1280, _bitrate = 1_500_000): Promise<File> {
  return file;
}

export async function compressAudio(file: File, bitrate = 64_000): Promise<File> {
  try {
    if (!file.type.startsWith("audio/")) return file;
    if (file.size < 200 * 1024) return file;
    if (typeof MediaRecorder === "undefined") return file;
    const arr = await file.arrayBuffer();
    const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return file;
    const ac = new AC();
    const buf = await ac.decodeAudioData(arr.slice(0));
    const dest = ac.createMediaStreamDestination();
    const src = ac.createBufferSource();
    src.buffer = buf; src.connect(dest);
    let mime = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mime)) return file;
    const rec = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: bitrate });
    const chunks: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise<Blob>(res => { rec.onstop = () => res(new Blob(chunks, { type: mime })); });
    rec.start(200);
    src.start();
    await new Promise<void>(res => setTimeout(res, buf.duration * 1000 + 200));
    rec.stop();
    const blob = await done;
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webm"), { type: mime });
  } catch {
    return file;
  }
}
