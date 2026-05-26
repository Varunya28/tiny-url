import mongoose, { Schema, Document } from "mongoose";

export interface IClickAnalytics {
  timestamp: Date;
  referrer: string;
  device: string;
  browser: string;
  country: string;
}

export interface IUrl extends Document {
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
  alias?: string;
  password?: string;
  expiresAt?: Date;
  analytics: IClickAnalytics[];
}

const ClickAnalyticsSchema = new Schema<IClickAnalytics>({
  timestamp: { type: Date, default: Date.now },
  referrer: { type: String, default: "Direct" },
  device: { type: String, default: "Desktop" },
  browser: { type: String, default: "Other" },
  country: { type: String, default: "Unknown" },
});

const UrlSchema = new Schema<IUrl>({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 },
  alias: { type: String },
  password: { type: String },
  expiresAt: { type: Date },
  analytics: [ClickAnalyticsSchema],
});

export default mongoose.model<IUrl>("Url", UrlSchema);