"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Frown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border-slate-800/80 text-slate-100 shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2 border border-indigo-500/20">
            <Frown className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">404 - Page Not Found</CardTitle>
          <CardDescription className="text-slate-400">
            The page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => navigate("/")} 
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold h-10 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;