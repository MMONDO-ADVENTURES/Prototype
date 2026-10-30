const UPLOAD = "/image/upload/";

export function cld(src, { w = 800, h, crop = "fill" } = {}) {
  if (!src || typeof src !== "string") return src || "";
  const uploadAt = src.indexOf(UPLOAD);
  if (uploadAt === -1) return src;

  const rest = src.slice(uploadAt + UPLOAD.length);
  const firstSeg = rest.split("/")[0] || "";
  if (/(?:^|,)(?:f_|q_|w_|h_|c_|g_|e_|dpr_)/.test(firstSeg)) return src;

  const raster = /\.svg(?:$|\?)/i.test(src) ? "f_jpg" : "f_auto";
  const parts = [raster, "q_auto"];
  if (w) parts.push(`w_${Math.round(w)}`);
  if (h) parts.push(`h_${Math.round(h)}`);
  if (crop) parts.push(`c_${crop}`);
  if (crop === "fill") parts.push("g_auto");
  return `${src.slice(0, uploadAt + UPLOAD.length)}${parts.join(",")}/${rest}`;
}

export const cldHero = (src) => cld(src, { w: 1600 });
export const cldCard = (src) => cld(src, { w: 720 });
export const cldThumb = (src) => cld(src, { w: 400 });
export const cldAvatar = (src) => cld(src, { w: 80 });
