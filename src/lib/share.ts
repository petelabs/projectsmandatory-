import { Song, Album, Playlist } from '../types';

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export function getShareUrl(path: string): string {
  const origin = window.location.origin;
  return `${origin}/#${path}`;
}

export async function shareContent(
  options: ShareOptions,
  onCopied?: () => void
): Promise<'shared' | 'copied' | 'failed'> {
  const shareData = {
    title: options.title,
    text: options.text,
    url: options.url,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return 'failed';
      }
    }
  }

  // Fallback to Clipboard Copy
  try {
    await navigator.clipboard.writeText(`${options.text} - ${options.url}`);
    if (onCopied) onCopied();
    return 'copied';
  } catch {
    // Legacy fallback
    const textarea = document.createElement('textarea');
    textarea.value = `${options.text} - ${options.url}`;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      if (onCopied) onCopied();
      return 'copied';
    } catch {
      return 'failed';
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function shareSong(song: Song, onCopied?: () => void) {
  const url = getShareUrl(`/song/${song.id}`);
  return shareContent(
    {
      title: `${song.title} by ${song.artist}`,
      text: `🎵 Listen to "${song.title}" by ${song.artist} on PROJECTS MANDATORY digital music platform!`,
      url,
    },
    onCopied
  );
}

export function shareAlbum(album: Album, onCopied?: () => void) {
  const url = getShareUrl(`/album/${album.id}`);
  return shareContent(
    {
      title: `${album.title} by ${album.artist}`,
      text: `💿 Check out the album "${album.title}" by ${album.artist} on PROJECTS MANDATORY!`,
      url,
    },
    onCopied
  );
}

export function sharePlaylist(playlist: Playlist, onCopied?: () => void) {
  const url = getShareUrl(`/playlist/${playlist.id}`);
  return shareContent(
    {
      title: playlist.title,
      text: `🎧 Check out the playlist "${playlist.title}" curated on PROJECTS MANDATORY!`,
      url,
    },
    onCopied
  );
}

export function shareArtist(artist: { id: string; name: string }, onCopied?: () => void) {
  const url = getShareUrl(`/artist/${artist.id}`);
  return shareContent(
    {
      title: artist.name,
      text: `🎤 Discover music and support ${artist.name} directly on PROJECTS MANDATORY!`,
      url,
    },
    onCopied
  );
}
