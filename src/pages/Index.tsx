"use client";

import React, { useState, useEffect } from "react";
import { db, ShortenedURL } from "@/utils/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, Copy, Check, Trash2, BarChart3, ExternalLink, 
  QrCode, Calendar, Lock, Sparkles, RefreshCw, ArrowRight, 
  Globe, Laptop, Compass, ArrowUpRight, Plus, Layers, Info
} from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie 
} from "recharts";

const Index = () => {
  // State
  const [urls, setUrls] = useState<ShortenedURL[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<ShortenedURL[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Load URLs on mount
  useEffect(() => {
    const allUrls = db.getAll();
    setUrls(allUrls);
    if (allUrls.length > 0) {
      setSelectedUrl(allUrls[0]);
    }
  }, []);

  // Handle single URL shortening
  const handleShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      const newUrl = db.create({
        originalUrl: inputUrl,
        alias: alias || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
      });

      setUrls(db.getAll());
      setSelectedUrl(newUrl);
      setInputUrl("");
      setAlias("");
      setPassword("");
      setExpiresAt("");
      toast.success("URL shortened successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to shorten URL");
    }
  };

  // Handle bulk URL shortening
  const handleBulkShorten = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkInput.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) {
      toast.error("Please enter at least one URL");
      return;
    }

    const results: ShortenedURL[] = [];
    let successCount = 0;

    lines.forEach(line => {
      try {
        const newUrl = db.create({ originalUrl: line });
        results.push(newUrl);
        successCount++;
      } catch (err) {
        // Skip failed ones in bulk
      }
    });

    setUrls(db.getAll());
    setBulkResults(results);
    if (results.length > 0) {
      setSelectedUrl(results[0]);
    }
    toast.success(`Successfully shortened ${successCount} URLs!`);
  };

  // Copy to clipboard helper
  const handleCopy = (code: string, id: string) => {
    const shortUrl = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete URL helper
  const handleDelete = (id: string) => {
    db.delete(id);
    const updated = db.getAll();
    setUrls(updated);
    if (selectedUrl?.id === id) {
      setSelectedUrl(updated[0] || null);
    }
    toast.success("Link deleted successfully");
  };

  // Generate QR Code
  const handleShowQr = (code: string) => {
    const shortUrl = `${window.location.origin}/r/${code}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
    setQrCodeUrl(qrApiUrl);
    setQrModalOpen(true);
  };

  // Process analytics data for charts
  const getAnalyticsData = () => {
    if (!selectedUrl || !selectedUrl.analytics || selectedUrl.analytics.length === 0) {
      return {
        timeline: [],
        referrers: [],
        devices: [],
        countries: []
      };
    }

    // 1. Timeline (last 7 days)
    const timelineMap: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timelineMap[dateStr] = 0;
    }

    selectedUrl.analytics.forEach(click => {
      const dateStr = new Date(click.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (timelineMap[dateStr] !== undefined) {
        timelineMap[dateStr]++;
      }
    });

    const timeline = Object.keys(timelineMap).map(date => ({
      date,
      clicks: timelineMap[date]
    }));

    // 2. Referrers
    const referrerMap: { [key: string]: number } = {};
    selectedUrl.analytics.forEach(click => {
      referrerMap[click.referrer] = (referrerMap[click.referrer] || 0) + 1;
    });
    const referrers = Object.keys(referrerMap).map(name => ({
      name,
      value: referrerMap[name]
    })).sort((a, b) => b.value - a.value);

    // 3. Devices
    const deviceMap: { [key: string]: number } = {};
    selectedUrl.analytics.forEach(click => {
      deviceMap[click.device] = (deviceMap[click.device] || 0) + 1;
    });
    const devices = Object.keys(deviceMap).map(name => ({
      name,
      value: deviceMap[name]
    }));

    // 4. Countries
    const countryMap: { [key: string]: number } = {};
    selectedUrl.analytics.forEach(click => {
      countryMap[click.country] = (countryMap[click.country] || 0) + 1;
    });
    const countries = Object.keys(countryMap).map(name => ({
      name,
      value: countryMap[name]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { timeline, referrers, devices, countries };
  };

  const { timeline, referrers, devices, countries } = getAnalyticsData();

  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Link2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Trimly
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">
              v2.0 Active
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-12 sm:py-16 border-b border-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium mb-4 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Advanced URL Shortening & Analytics
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Shorten Links. Track Performance.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            Create custom, secure, and trackable short links with real-time analytics, password protection, and QR code generation.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Shortener Forms & Link List */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Shortener Tabs */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <Tabs defaultValue="single" className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800">
                    <TabsTrigger value="single" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                      <Link2 className="h-4 w-4 mr-2" /> Single Link
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                      <Layers className="h-4 w-4 mr-2" /> Bulk Shorten
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Single Link Shortener */}
                <TabsContent value="single">
                  <form onSubmit={handleShorten} className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination URL</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="https://example.com/very-long-link-to-shorten"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    {/* Advanced Options Accordion */}
                    <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50 space-y-3">
                      <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" /> Advanced Options (Optional)
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {/* Custom Alias */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">Custom Alias</label>
                          <Input
                            type="text"
                            placeholder="e.g. my-promo"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-slate-100 h-8 text-xs"
                          />
                        </div>

                        {/* Password Protection */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Password Protection
                          </label>
                          <Input
                            type="password"
                            placeholder="Access password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-slate-100 h-8 text-xs"
                          />
                        </div>

                        {/* Expiration Date */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" /> Expiration Date
                          </label>
                          <Input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-slate-100 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                      Shorten URL
                    </Button>
                  </form>
                </TabsContent>

                {/* Bulk Link Shortener */}
                <TabsContent value="bulk">
                  <form onSubmit={handleBulkShorten} className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URLs (One per line)</label>
                      <textarea
                        placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-sm text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                      Bulk Shorten
                    </Button>

                    {bulkResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-slate-400">Shortened Links:</div>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {bulkResults.map((url) => (
                            <div key={url.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                              <span className="truncate max-w-[180px] text-slate-400">{url.originalUrl}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-indigo-400 font-mono">/{url.shortCode}</span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-slate-400 hover:text-white"
                                  onClick={() => handleCopy(url.shortCode, url.id)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Active Links List */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Active Links</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                    {urls.length} total
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Select a link to view detailed analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800/50">
                  {urls.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Link2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No links shortened yet.
                    </div>
                  ) : (
                    urls.map((url) => (
                      <div
                        key={url.id}
                        onClick={() => setSelectedUrl(url)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                          selectedUrl?.id === url.id ? "bg-indigo-600/10 border-l-2 border-indigo-500" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-400 font-semibold truncate">
                              /{url.shortCode}
                            </span>
                            {url.password && <Lock className="h-3 w-3 text-amber-500" />}
                            {url.expiresAt && <Calendar className="h-3 w-3 text-rose-500" />}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{url.originalUrl}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-medium">
                            {url.clicks} clicks
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(url.shortCode, url.id);
                            }}
                          >
                            {copiedId === url.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-rose-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(url.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Analytics Dashboard */}
          <div className="lg:col-span-7">
            {selectedUrl ? (
              <div className="space-y-6">
                
                {/* Selected Link Overview */}
                <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Selected Link</div>
                        <CardTitle className="text-2xl font-mono font-bold text-white flex items-center gap-2">
                          /{selectedUrl.shortCode}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleCopy(selectedUrl.shortCode, selectedUrl.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center gap-1.5 text-xs h-9"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </Button>
                        <Button
                          onClick={() => handleShowQr(selectedUrl.shortCode)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center gap-1.5 text-xs h-9"
                        >
                          <QrCode className="h-3.5 w-3.5" /> QR Code
                        </Button>
                        <a
                          href={`/r/${selectedUrl.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2 gap-1.5"
                        >
                          Visit <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 border-t border-slate-800/50 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                        <div className="text-xs text-slate-500 mb-1">Original Destination</div>
                        <a 
                          href={selectedUrl.originalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-indigo-400 hover:underline font-medium break-all flex items-center gap-1"
                        >
                          {selectedUrl.originalUrl} <ArrowUpRight className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Created</div>
                          <div className="text-xs font-medium text-slate-300">
                            {new Date(selectedUrl.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Total Clicks</div>
                          <div className="text-xs font-bold text-emerald-400">
                            {selectedUrl.clicks}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security & Expiration Badges */}
                    {(selectedUrl.password || selectedUrl.expiresAt) && (
                      <div className="flex flex-wrap gap-2">
                        {selectedUrl.password && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Lock className="h-3 w-3" /> Password Protected
                          </span>
                        )}
                        {selectedUrl.expiresAt && (
                          <span className="inline-flex items-center gap-1 text-xs bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <Calendar className="h-3 w-3" /> Expires: {new Date(selectedUrl.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Click Timeline */}
                  <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-400" /> Click History (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                      {timeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeline}>
                            <defs>
                              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                              labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                          <Info className="h-8 w-8 mb-2 opacity-20" />
                          No click data available yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Referrers */}
                  <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-400" /> Top Referrers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-56">
                      {referrers.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={referrers} layout="vertical">
                            <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                              {referrers.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                          No referrer data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Devices */}
                  <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-indigo-400" /> Device Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-56 flex items-center justify-center">
                      {devices.length > 0 ? (
                        <div className="w-full h-full flex flex-col justify-between">
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={devices}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={60}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {devices.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-center gap-4 text-xs">
                            {devices.map((device, index) => (
                              <div key={device.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-slate-400">{device.name} ({device.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm">No device data available.</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Countries */}
                  <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Compass className="h-4 w-4 text-indigo-400" /> Top Countries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {countries.length > 0 ? (
                        <div className="space-y-3">
                          {countries.map((country, index) => (
                            <div key={country.name} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-300">{country.name}</span>
                                <span className="text-slate-400">{country.value} clicks</span>
                              </div>
                              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full" 
                                  style={{ width: `${(country.value / selectedUrl.clicks) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-sm">
                          No country data available.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900/50 border border-slate-800 rounded-xl">
                <Link2 className="h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No Link Selected</h3>
                <p className="text-slate-500 max-w-xs mt-1">
                  Shorten a URL or select an existing link from the list to view its performance analytics.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* QR Code Modal */}
      {qrModalOpen && qrCodeUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">QR Code Generated</CardTitle>
              <CardDescription className="text-slate-400">
                Scan this code to visit the shortened link.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-3 rounded-xl">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeUrl;
                    link.download = `qr-${selectedUrl?.shortCode || 'code'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Download QR
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setQrModalOpen(false)}
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;