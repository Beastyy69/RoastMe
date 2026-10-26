// Photo ko chhota JPEG bana ke text (data URL) me badalta hai, taaki AI ko jaldi bheja ja sake.
// "Roast my look" on ho tabhi ye photo backend → NVIDIA/Gemini tak jaati hai.

export function toJpegDataUrl(sourceCanvas, maxSide = 768, quality = 0.82) { // canvas → "data:image/jpeg;base64,..."
  const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height)); // badi ho to chhota karo
  const canvas = document.createElement("canvas"); // naya canvas
  canvas.width = Math.round(sourceCanvas.width * scale); // nayi width
  canvas.height = Math.round(sourceCanvas.height * scale); // nayi height
  canvas.getContext("2d").drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height); // chhoti copy draw
  return canvas.toDataURL("image/jpeg", quality); // JPEG text (~60-120 KB)
} // function band
