import { describe, it, expect } from 'vitest';

describe('Website Adapters URL & ID Extraction', () => {
  it('extracts YouTube Shorts video ID correctly', () => {
    const urls = [
      { url: '/shorts/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
      { url: '/shorts/abc_123-XYZ', expected: 'abc_123-XYZ' },
      { url: '/shorts/abc_123-XYZ?feature=share', expected: 'abc_123-XYZ' },
    ];

    for (const { url, expected } of urls) {
      const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      expect(match ? match[1] : null).toBe(expected);
    }
  });

  it('identifies non-shorts YouTube URLs', () => {
    const nonShorts = [
      '/watch?v=dQw4w9WgXcQ',
      '/feed/subscriptions',
      '/',
      '/channel/UC12345',
    ];

    for (const url of nonShorts) {
      const isShorts = url.startsWith('/shorts');
      expect(isShorts).toBe(false);
    }
  });

  it('extracts Instagram Reels shortcode correctly', () => {
    const urls = [
      { url: '/reels/C_8abcd123/', expected: 'C_8abcd123' },
      { url: '/reel/C_8abcd123/', expected: 'C_8abcd123' },
      { url: '/reels/C_8abcd123', expected: 'C_8abcd123' },
      { url: '/reel/XYZ_987-abc?igsh=123', expected: 'XYZ_987-abc' },
    ];

    for (const { url, expected } of urls) {
      const match = url.match(/\/(?:reels|reel)\/([a-zA-Z0-9_-]+)/);
      expect(match ? match[1] : null).toBe(expected);
    }
  });

  it('identifies non-reels Instagram URLs', () => {
    const nonReels = [
      '/',
      '/explore/',
      '/direct/inbox/',
      '/username/',
      '/accounts/edit/',
    ];

    for (const url of nonReels) {
      const isReels = url.startsWith('/reels') || url.startsWith('/reel/');
      expect(isReels).toBe(false);
    }
  });
});
