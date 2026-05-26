"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/utils/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Loader2, ArrowRight, Lock, CalendarX } from "lucide-react";
import { toast } from "sonner";

const Redirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Invalid short link code.");
      setLoading(false);
      return;
    }

    const urlRecord = db.getByCode(code);

    if (!urlRecord) {
      setError("The requested short link does not exist or has been deleted.");
      setLoading(false);
      return;
    }

    // Check expiration
    if (urlRecord.expiresAt && new Date(urlRecord.expiresAt) < new Date()) {
      setError("This link has expired and is no longer active.");
      setLoading(false);
      return;
    }

    // Check if password protected
    if (urlRecord.password) {
      setPasswordRequired(true);
      setTargetUrl(urlRecord.originalUrl);
      setLoading(false);
    } else {
      // Perform direct redirect
      handleRedirect(code, urlRecord.originalUrl);
    }
  }, [code]);

  const handleRedirect = (shortCode: string, destination: string) => {
    try {
      db.recordClick(shortCode, {
        referrer: document.referrer || "Direct",
        userAgent: navigator.userAgent,
      });
      
      toast.success("Redirecting you now...");
      setTimeout(() => {
        window.location.href = destination;
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred during redirection.");
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const urlRecord = db.getByCode(code);
    if (urlRecord && urlRecord.password === passwordInput) {
      setPasswordRequired(false);
      setLoading(true);
      handleRedirect(code, urlRecord.originalUrl);
    } else {
      toast.error("Incorrect password. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full border-4 border-indigo-500/20 animate-ping" />
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Redirecting you</h2>
          <p className="text-slate-400 max-w-xs mx-auto">
            Please wait while we securely route you to your destination...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
              <CalendarX className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-xl text-red-400">Link Unavailable</CardTitle>
            <CardDescription className="text-slate-400">
              We couldn't complete your request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-200">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Password Protected Link</CardTitle>
            <CardDescription className="text-slate-400">
              This link requires a password to access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter link password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                Unlock & Redirect <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Redirect;