// Snapshot + roast text ko ek shareable image (PNG) me jodta hai, bilkul poster jaisa.

function wrapText(ctx, text, maxWidth) { // lamba text ko lines me todo
  const words = text.split(" "); // shabdon ki list
  const lines = []; // banne wali lines
  let line = ""; // abhi ki line
  for (const word of words) { // har shabd
    const test = line ? `${line} ${word}` : word; // line me shabd jod ke dekho
    if (ctx.measureText(test).width > maxWidth && line) { // jagah se bahar ja raha?
      lines.push(line); // purani line save
      line = word; // nayi line is shabd se
    } else { // jagah hai
      line = test; // shabd jod do
    } // if/else band
  } // loop band
  if (line) lines.push(line); // aakhri line bhi jodo
  return lines; // saari lines
} // function band

export function createRoastCard(photoCanvas, { title, roast, score }) { // photo + roast → poster canvas
  const width = 1080; // poster ki width (Instagram jaisa)
  const photoHeight = Math.round((photoCanvas.height / photoCanvas.width) * width); // photo ki height (ratio same)
  const padding = 64; // kinaro se jagah

  // pehle text ki lines naap lo taaki card ki height sahi bane
  const measure = document.createElement("canvas").getContext("2d"); // naapne ke liye canvas
  measure.font = "500 34px Inter, system-ui, sans-serif"; // roast text ka font
  const lines = wrapText(measure, roast, width - padding * 2); // roast ki lines
  const textHeight = 200 + lines.length * 50 + 90; // text area ki height

  const card = document.createElement("canvas"); // asli poster canvas
  card.width = width; // width
  card.height = photoHeight + textHeight; // photo + text ki height
  const ctx = card.getContext("2d"); // drawing context

  ctx.fillStyle = "#0a0a0b"; // dark background
  ctx.fillRect(0, 0, width, card.height); // poora bharo
  ctx.drawImage(photoCanvas, 0, 0, width, photoHeight); // upar photo

  // photo ke neeche halka fade, taaki text area smooth lage
  const fade = ctx.createLinearGradient(0, photoHeight - 160, 0, photoHeight); // upar se neeche gradient
  fade.addColorStop(0, "rgba(10,10,11,0)"); // upar transparent
  fade.addColorStop(1, "rgba(10,10,11,1)"); // neeche dark
  ctx.fillStyle = fade; // gradient lagao
  ctx.fillRect(0, photoHeight - 160, width, 160); // photo ke neeche 160px pe

  let y = photoHeight + 40; // text ki pehli line ki height
  ctx.fillStyle = "#a78bfa"; // violet color
  ctx.font = "600 28px Inter, system-ui, sans-serif"; // chhota bold font
  ctx.fillText(`ROAST SCORE ${score}/100`, padding, y); // score likho

  y += 62; // neeche jao
  ctx.fillStyle = "#ffffff"; // white
  ctx.font = "700 52px Inter, system-ui, sans-serif"; // bada bold font
  ctx.fillText(title, padding, y); // title likho

  y += 70; // neeche jao
  ctx.fillStyle = "#d4d4d8"; // light grey
  ctx.font = "500 34px Inter, system-ui, sans-serif"; // normal font
  for (const line of lines) { // roast ki har line
    ctx.fillText(line, padding, y); // likho
    y += 50; // agli line neeche
  } // loop band

  ctx.fillStyle = "#71717a"; // dark grey
  ctx.font = "500 26px Inter, system-ui, sans-serif"; // chhota font
  ctx.fillText("RoastMe AI · for entertainment only", padding, card.height - 44); // neeche branding

  return card; // poster canvas wapas
} // function band

export function canvasToBlob(canvas) { // canvas → PNG file data
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png")); // toBlob callback ko promise me badlo
} // function band
