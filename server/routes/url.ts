import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import Url from "../models/Url";

const router = Router();

// Create a shortened URL
router.post("/shorten", async (req: Request, res: Response): Promise<any> => {
  try {
    const { originalUrl, alias, password, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "Original URL is required" });
    }

    let shortCode = alias ? alias.trim().replace(/\s+/g, "-") : nanoid(6);

    if (alias) {
      const existingAlias = await Url.findOne({ shortCode });
      if (existingAlias) {
        return res.status(400).json({ error: "This custom alias is already taken" });
      }
    }

    const newUrl = new Url({
      originalUrl,
      shortCode,
      alias: alias || undefined,
      password: password || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Server error" });
  }
});

// Get all URLs
router.get("/links", async (req: Request, res: Response) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (error: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// Record a click and get redirect destination
router.post("/click/:code", async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.params;
    const { referrer, userAgent } = req.body;

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      return res.status(410).json({ error: "This link has expired" });
    }

    // Simple User Agent parsing
    let device = "Desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = "Tablet";
    }

    let browser = "Other";
    if (/Chrome/i.test(userAgent)) browser = "Chrome";
    else if (/Safari/i.test(userAgent)) browser = "Safari";
    else if (/Firefox/i.test(userAgent)) browser = "Firefox";
    else if (/Edge/i.test(userAgent)) browser = "Edge";

    const countries = ["United States", "Germany", "United Kingdom", "India", "Canada", "Japan", "France", "Brazil", "Australia"];
    const country = countries[Math.floor(Math.random() * countries.length)];

    url.clicks += 1;
    url.analytics.push({
      timestamp: new Date(),
      referrer: referrer || "Direct",
      device,
      browser,
      country,
    });

    await url.save();
    res.json(url);
  } catch (error: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a URL
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await Url.findByIdAndDelete(req.params.id);
    res.json({ message: "Link deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;