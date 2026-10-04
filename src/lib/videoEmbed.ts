// Resuelve URLs de fuentes audiovisuales (YouTube, Instagram, TikTok, Facebook,
// Vimeo, Dailymotion, Google Drive o archivo directo) a una URL embebible.
// Se usa en build (SSG) para el desplegable de reproducción de la sección de
// referencias del detalle de evento: el iframe NO se emite en el HTML, solo se
// construye en el cliente cuando el usuario abre el <details> (ver VideoEmbed.astro).
// Nada aquí toca el DOM: es una función pura sobre la URL.

export type VideoLayout = 'landscape' | 'portrait' | 'square';

export type VideoEmbed = {
  // Etiqueta visible: "YouTube", "Instagram", "TikTok"...
  platform: string;
  // URL que va dentro del iframe (o del <video> cuando kind === 'file').
  embedUrl: string;
  layout: VideoLayout;
  // 'iframe' para plataformas; 'file' para un archivo de video directo.
  kind: 'iframe' | 'file';
};

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'm.instagram.com']);

const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com']);

const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

const DAILYMOTION_HOSTS = new Set(['dailymotion.com', 'www.dailymotion.com', 'dai.ly']);

const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

const DIRECT_VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)$/i;

function parse(rawUrl?: string | null): URL | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl.trim());
  } catch {
    return null;
  }
}

function youtubeEmbed(url: URL): VideoEmbed | null {
  const host = url.hostname.toLowerCase();
  let id: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else {
    if (!YOUTUBE_HOSTS.has(host)) return null;
    const v = url.searchParams.get('v');
    if (v) {
      id = v;
    } else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]+)/);
      if (m) id = m[1];
    }
  }

  if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
  return {
    platform: 'YouTube',
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    layout: 'landscape',
    kind: 'iframe',
  };
}

function instagramEmbed(url: URL): VideoEmbed | null {
  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  const m = url.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const kind = m[1] === 'p' ? 'p' : 'reel';
  return {
    platform: 'Instagram',
    embedUrl: `https://www.instagram.com/${kind}/${m[2]}/embed`,
    layout: kind === 'p' ? 'square' : 'portrait',
    kind: 'iframe',
  };
}

function tiktokEmbed(url: URL): VideoEmbed | null {
  if (!TIKTOK_HOSTS.has(url.hostname.toLowerCase())) return null;
  const m = url.pathname.match(/\/(?:video|embed\/v2|v)\/(\d{6,})/);
  if (!m) return null;
  return {
    platform: 'TikTok',
    embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`,
    layout: 'portrait',
    kind: 'iframe',
  };
}

function facebookEmbed(url: URL): VideoEmbed | null {
  const host = url.hostname.toLowerCase();
  if (!FACEBOOK_HOSTS.has(host)) return null;
  // Solo videos/reels: un post de texto de Facebook no tiene reproductor.
  const isVideo =
    /\/(?:videos|reel|share\/v)\//.test(url.pathname) || url.searchParams.has('v');
  if (!isVideo) return null;
  return {
    platform: 'Facebook',
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.href)}&show_text=false`,
    layout: 'landscape',
    kind: 'iframe',
  };
}

function vimeoEmbed(url: URL): VideoEmbed | null {
  if (!VIMEO_HOSTS.has(url.hostname.toLowerCase())) return null;
  const m = url.pathname.match(/\/(?:video\/)?(\d{6,})/);
  if (!m) return null;
  return {
    platform: 'Vimeo',
    embedUrl: `https://player.vimeo.com/video/${m[1]}`,
    layout: 'landscape',
    kind: 'iframe',
  };
}

function dailymotionEmbed(url: URL): VideoEmbed | null {
  if (!DAILYMOTION_HOSTS.has(url.hostname.toLowerCase())) return null;
  if (url.hostname.toLowerCase() === 'dai.ly') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    if (!id) return null;
    return {
      platform: 'Dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
      layout: 'landscape',
      kind: 'iframe',
    };
  }
  const m = url.pathname.match(/\/video\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return {
    platform: 'Dailymotion',
    embedUrl: `https://www.dailymotion.com/embed/video/${m[1]}`,
    layout: 'landscape',
    kind: 'iframe',
  };
}

function driveEmbed(url: URL): VideoEmbed | null {
  const host = url.hostname.toLowerCase();
  if (!DRIVE_HOSTS.has(host)) return null;
  const m = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  return {
    platform: 'Google Drive',
    embedUrl: `https://drive.google.com/file/d/${m[1]}/preview`,
    layout: 'landscape',
    kind: 'iframe',
  };
}

export function resolveVideoEmbed(rawUrl?: string | null): VideoEmbed | null {
  const url = parse(rawUrl);
  if (!url || !/^https?:$/.test(url.protocol)) return null;

  if (DIRECT_VIDEO_EXT.test(url.pathname)) {
    return { platform: 'Video', embedUrl: url.href, layout: 'landscape', kind: 'file' };
  }

  return (
    youtubeEmbed(url) ??
    instagramEmbed(url) ??
    tiktokEmbed(url) ??
    facebookEmbed(url) ??
    vimeoEmbed(url) ??
    dailymotionEmbed(url) ??
    driveEmbed(url)
  );
}
