// 教材 PDF 资源：本地缺失时引导用户从开源仓库下载并放到对应完整路径。
// PDF 不进 git（见 .gitignore），新克隆 / 换设备后需手动放置。

// 开源教材仓库（含人教版等扫描 PDF），用户从这里下载对应册次
export const TEXTBOOK_REPO = 'https://github.com/chaserr/ChinaTextbook';

// 把对外的 public URL（/textbooks/...）换算成仓库内的完整放置路径，
// 用于在缺失提示里告诉用户文件该放哪。
export function localPdfPath(publicUrl) {
  const idx = publicUrl.indexOf('textbooks/');
  const rel = idx >= 0 ? publicUrl.slice(idx) : publicUrl.replace(/^\/+/, '');
  return `client/public/${rel}`;
}

// HEAD 探测 PDF 是否真实存在。
// 注意：SPA 路由回退会让缺失路径返回 index.html(200)，需用 content-type 排除。
export async function checkPdfExists(publicUrl) {
  try {
    const res = await fetch(publicUrl, { method: 'HEAD' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (type.includes('text/html')) return false; // SPA fallback，文件实际不存在
    return true;
  } catch {
    return false;
  }
}
