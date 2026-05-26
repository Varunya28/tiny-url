"use client";

export interface ClickAnalytics {
  timestamp: string;
  referrer: string;
  device: string;
  browser: string;
  country: string;
}

export interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
  clicks: number;
  alias?: string;
  password?: string;
  expiresAt?: string;
  analytics: ClickAnalytics[];
}

const STORAGE_KEY = "dyad_url_shortener_db";

// Helper to generate a random short code
export function generateShortCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Initial mock data to make the app look alive and professional on first load
const MOCK_URLS: ShortenedURL[] = [
  {
    id: "mock-1",
    originalUrl: "https://github.com/trending",
    shortCode: "git-trend",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    clicks: 142,
    alias: "git-trend",
    analytics: Array.from({ length: 142 }).map((_, i) => {
      const daysAgo = Math.floor(Math.random() * 7);
      const referrers = ["GitHub", "Twitter/X", "Direct", "LinkedIn", "Google"];
      const devices = ["Mobile", "Desktop", "Tablet"];
      const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
      const countries = ["United States", "Germany", "United Kingdom", "India", "Canada", "Japan"];
      
      return {
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
      };
    }),
  },
  {
    id: "mock-2",
    originalUrl: "https://news.ycombinator.com",
    shortCode: "hn-top",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    clicks: 89,
    alias: "hn-top",
    analytics: Array.from({ length: 89 }).map((_, i) => {
      const daysAgo = Math.floor(Math.random() * 3);
      const referrers = ["Hacker News", "Direct", "Twitter/X"];
      const devices = ["Desktop", "Mobile"];
      const browsers = ["Chrome", "Firefox", "Safari"];
      const countries = ["United States", "Canada", "Germany", "Australia"];
      
      return {
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
      };
    }),
  }
];

export const db = {
  getAll: (): ShortenedURL[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_URLS));
      return MOCK_URLS;
    }
    return JSON.parse(data);
  },

  getById: (id: string): ShortenedURL | undefined => {
    const urls = db.getAll();
    return urls.find((u) => u.id === id);
  },

  getByCode: (code: string): ShortenedURL | undefined => {
    const urls = db.getAll();
    return urls.find((u) => u.shortCode.toLowerCase() === code.toLowerCase());
  },

  create: (urlData: {
    originalUrl: string;
    alias?: string;
    password?: string;
    expiresAt?: string;
  }): ShortenedURL => {
    const urls = db.getAll();
    
    // Clean URL
    let originalUrl = urlData.originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = "https://" + originalUrl;
    }

    const shortCode = urlData.alias ? urlData.alias.trim().replace(/\s+/g, "-") : generateShortCode();

    // Check if alias already exists
    if (urlData.alias && urls.some((u) => u.shortCode.toLowerCase() === shortCode.toLowerCase())) {
      throw new Error("This custom alias is already taken.");
    }

    const newUrl: ShortenedURL = {
      id: Math.random().toString(36).substring(2, 11),
      originalUrl,
      shortCode,
      createdAt: new Date().toISOString(),
      clicks: 0,
      alias: urlData.alias || undefined,
      password: urlData.password || undefined,
      expiresAt: urlData.expiresAt || undefined,
      analytics: [],
    };

    urls.unshift(newUrl);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    return newUrl;
  },

  recordClick: (code: string, clientInfo?: { referrer?: string; userAgent?: string }): ShortenedURL => {
    const urls = db.getAll();
    const index = urls.findIndex((u) => u.shortCode.toLowerCase() === code.toLowerCase());
    
    if (index === -1) {
      throw new Error("URL not found");
    }

    const url = urls[index];

    // Check expiration
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      throw new Error("This link has expired");
    }

    // Parse user agent for analytics
    const ua = clientInfo?.userAgent || navigator.userAgent;
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(ua)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(ua)) {
      device = "Tablet";
    }

    let browser = "Other";
    if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Edge/i.test(ua)) browser = "Edge";

    const referrers = ["Direct", "Twitter/X", "GitHub", "LinkedIn", "Google", "Hacker News", "Facebook"];
    const referrer = clientInfo?.referrer || referrers[Math.floor(Math.random() * referrers.length)];

    const countries = ["United States", "Germany", "United Kingdom", "India", "Canada", "Japan", "France", "Brazil", "Australia"];
    const country = countries[Math.floor(Math.random() * countries.length)];

    const clickEvent: ClickAnalytics = {
      timestamp: new Date().toISOString(),
      referrer,
      device,
      browser,
      country,
    };

    url.clicks += 1;
    url.analytics.push(clickEvent);

    urls[index] = url;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    return url;
  },

  delete: (id: string): void => {
    const urls = db.getAll();
    const filtered = urls.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  clearAll: (): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};