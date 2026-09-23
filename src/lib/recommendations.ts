import { Song, Album, Playlist } from '../types';

export interface ArtistSummary {
  id: string;
  name: string;
  image: string;
  genres: string[];
  listeners: string;
  songCount: number;
}

// Simple Levenshtein distance for lightweight typo tolerance
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let j = 0; j <= bn; ++j) matrix[j][0] = j;

  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          Math.min(
            matrix[j][i - 1] + 1, // insertion
            matrix[j - 1][i] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[bn][an];
}

export function fuzzyMatches(source: string, targetQuery: string): boolean {
  if (!source || !targetQuery) return false;
  const s = source.toLowerCase().trim();
  const q = targetQuery.toLowerCase().trim();

  // Exact substring
  if (s.includes(q)) return true;

  // Split query into tokens
  const qTokens = q.split(/\s+/).filter(Boolean);
  const sTokens = s.split(/\s+/).filter(Boolean);

  // If every token has a substring or typo match
  return qTokens.every((token) => {
    // Exact word or prefix match
    if (sTokens.some((word) => word.includes(token) || token.includes(word))) return true;

    // Typo tolerance: if word length is >= 4, allow distance <= 2; if length is 3, allow distance <= 1
    const maxDist = token.length >= 5 ? 2 : token.length >= 3 ? 1 : 0;
    if (maxDist > 0) {
      return sTokens.some((word) => levenshteinDistance(word, token) <= maxDist);
    }
    return false;
  });
}

/**
 * Extract unique artists from song list
 */
export function extractArtistsFromSongs(songs: Song[]): ArtistSummary[] {
  const map = new Map<string, ArtistSummary>();

  for (const song of songs) {
    const artistKey = (song.artistId || song.artist).toLowerCase();
    const existing = map.get(artistKey);

    if (existing) {
      existing.songCount += 1;
      if (!existing.genres.includes(song.genre)) {
        existing.genres.push(song.genre);
      }
    } else {
      map.set(artistKey, {
        id: song.artistId || `artist-${song.artist.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: song.artist,
        image: song.coverImage,
        genres: [song.genre],
        listeners: `${Math.floor(50 + ((song.downloadCount || 100) % 200))}K monthly listeners`,
        songCount: 1,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Made For You: Rule-based recommendation using history, liked songs, and genre affinities
 */
export function getMadeForYouSongs(
  songs: Song[],
  history: Song[],
  likedSongIds: string[],
  followedArtistIds: string[] = [],
  limit = 6
): Song[] {
  if (!songs || songs.length === 0) return [];

  // If new user with no history, return top featured & popular
  if ((!history || history.length === 0) && (!likedSongIds || likedSongIds.length === 0)) {
    return songs.slice(0, limit);
  }

  const likedSet = new Set(likedSongIds);
  const historyIds = new Set(history.map((s) => s.id));

  // Compute genre scores & artist scores
  const genreScores: Record<string, number> = {};
  const artistScores: Record<string, number> = {};

  // Score from liked songs (weight 3)
  for (const song of songs) {
    if (likedSet.has(song.id)) {
      genreScores[song.genre] = (genreScores[song.genre] || 0) + 3;
      artistScores[song.artist.toLowerCase()] = (artistScores[song.artist.toLowerCase()] || 0) + 3;
    }
  }

  // Score from history (weight 2 for recent, 1 for older)
  history.slice(0, 10).forEach((song, idx) => {
    const weight = idx < 3 ? 2 : 1;
    genreScores[song.genre] = (genreScores[song.genre] || 0) + weight;
    artistScores[song.artist.toLowerCase()] = (artistScores[song.artist.toLowerCase()] || 0) + weight;
  });

  // Score from followed artists (weight 4)
  for (const artistId of followedArtistIds) {
    artistScores[artistId.toLowerCase()] = (artistScores[artistId.toLowerCase()] || 0) + 4;
  }

  // Rank candidate songs
  const scored = songs.map((song) => {
    let score = 0;
    const gScore = genreScores[song.genre] || 0;
    const aScore = artistScores[song.artist.toLowerCase()] || (song.artistId ? artistScores[song.artistId.toLowerCase()] || 0 : 0);

    score += gScore * 2;
    score += aScore * 3;

    if (song.isPopular) score += 2;
    if (song.isLatest) score += 1;
    if (likedSet.has(song.id)) score += 1; // gentle boost

    return { song, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.song).slice(0, limit);
}

/**
 * "Because You Listened To..." context banner
 */
export function getBecauseYouListenedTo(
  songs: Song[],
  history: Song[]
): { contextName: string; type: 'artist' | 'genre'; songs: Song[] } | null {
  if (!history || history.length === 0 || !songs || songs.length < 2) return null;

  const mostRecent = history[0];
  if (!mostRecent) return null;

  // Try recommending by recent artist
  const byArtist = songs.filter(
    (s) => s.id !== mostRecent.id && (s.artist.toLowerCase() === mostRecent.artist.toLowerCase() || s.artistId === mostRecent.artistId)
  );

  if (byArtist.length >= 2) {
    return {
      contextName: mostRecent.artist,
      type: 'artist',
      songs: byArtist.slice(0, 5),
    };
  }

  // Fallback to genre of recent track
  const byGenre = songs.filter((s) => s.id !== mostRecent.id && s.genre === mostRecent.genre);
  if (byGenre.length >= 2) {
    return {
      contextName: mostRecent.genre,
      type: 'genre',
      songs: byGenre.slice(0, 5),
    };
  }

  return null;
}

/**
 * Filter songs by mood
 */
export function getSongsByMood(songs: Song[], moodName: string, limit = 6): Song[] {
  const normalized = moodName.toLowerCase();
  return songs
    .filter((s) => {
      if (s.moods && s.moods.some((m) => m.toLowerCase() === normalized)) return true;
      if (s.tags && s.tags.some((t) => t.toLowerCase() === normalized)) return true;
      if (normalized === 'chill' && (s.genre === 'Malawi' || s.genre === 'R&B')) return true;
      if (normalized === 'party' && (s.genre === 'Afrobeats' || s.genre === 'Afro-fusion')) return true;
      if (normalized === 'workout' && (s.genre === 'Hip-Hop' || s.genre === 'Afrobeats')) return true;
      if (normalized === 'relax' && (s.genre === 'Gospel' || s.genre === 'Malawi')) return true;
      if (normalized === 'focus' && (s.genre === 'Gospel' || s.genre === 'R&B')) return true;
      return false;
    })
    .slice(0, limit);
}

/**
 * Filter Malawi-specific tracks
 */
export function getMalawiTopSongs(songs: Song[], limit = 6): Song[] {
  return songs
    .filter(
      (s) =>
        s.genre === 'Malawi' ||
        (s.tags && s.tags.some((t) => t.toLowerCase() === 'malawi')) ||
        s.artist.toLowerCase().includes('lulu') ||
        s.artist.toLowerCase().includes('nkhata') ||
        s.artist.toLowerCase().includes('bwalya') ||
        s.artist.toLowerCase().includes('kizzo') ||
        s.artist.toLowerCase().includes('driemo')
    )
    .slice(0, limit);
}
