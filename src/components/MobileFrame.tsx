/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Smartphone, Shield, Wifi, Battery, Signal, Zap, Moon, Sun, Laptop } from "lucide-react";

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "none">("ios");
  const [currentTime, setCurrentTime] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(true);
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string } | null>(null);

  // Play a soft digital SMS chime via Web Audio API synth
  const playNotificationChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Note 1: High crisp notification tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Note 2: Secondary harmony tone slightly delayed
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6 note
          gain2.gain.setValueAtTime(0.08, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.25);
        } catch (innerErr) {}
      }, 80);

    } catch (e) {
      console.warn("Audio notification chime was blocked or unsupported.", e);
    }
  };

  // Register push-notification receiver
  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string }>;
      if (customEvent.detail) {
        setActiveNotification({
          title: customEvent.detail.title,
          body: customEvent.detail.body
        });
        playNotificationChime();
      }
    };

    window.addEventListener("mpesa-notification", handleNotification);
    return () => window.removeEventListener("mpesa-notification", handleNotification);
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Update mock clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulating battery discharge slightly over time
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        if (prev <= 15) {
          setIsCharging(true);
          return 100; // recharge simulated
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (deviceType === "none") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Device Simulator:</span>
          <button
            onClick={() => setDeviceType("ios")}
            className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            iPhone
          </button>
          <button
            onClick={() => setDeviceType("android")}
            className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Android
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center py-6 px-4 md:py-10 selection:bg-[#00B140] selection:text-white">
      {/* Device Simulator Controller */}
      <div className="mb-4 flex items-center justify-between w-full max-w-sm bg-[#121214] border border-white/10 rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#00B140]" />
          <span className="text-xs font-semibold text-white/80">Device View</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#090909] p-0.5 rounded-full border border-white/5">
          <button
            onClick={() => setDeviceType("ios")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
              deviceType === "ios"
                ? "bg-[#00B140] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            iOS
          </button>
          <button
            onClick={() => setDeviceType("android")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
              deviceType === "android"
                ? "bg-[#00B140] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setDeviceType("none")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
              deviceType === "none"
                ? "bg-[#00B140] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
            title="Full Screen / Non-Mobile Layout"
          >
            Full
          </button>
        </div>
      </div>

      {/* Main Smartphone Shell */}
      <div className="relative mx-auto transition-all duration-500 ease-in-out">
        {/* Mock side hardware buttons */}
        <div className="absolute top-28 -left-[3px] w-[3px] h-10 bg-zinc-800 rounded-l" />
        <div className="absolute top-44 -left-[3px] w-[3px] h-14 bg-zinc-800 rounded-l" />
        <div className="absolute top-60 -left-[3px] w-[3px] h-14 bg-zinc-800 rounded-l" />
        <div className="absolute top-36 -right-[3px] w-[3px] h-16 bg-zinc-800 rounded-r" />

        {/* Outer Phone Frame */}
        <div
          className={`w-[390px] h-[812px] bg-black rounded-[50px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border-[6px] relative overflow-hidden transition-all duration-300 ${
            deviceType === "ios" ? "border-zinc-800" : "border-zinc-700 rounded-[44px]"
          }`}
        >
          {/* Internal Bezel Display Container */}
          <div className="w-full h-full bg-[#090909] rounded-[38px] overflow-hidden flex flex-col relative select-none">
            
            {/* Status Bar */}
            <div className="h-10 bg-[#090909] px-6 flex items-center justify-between text-white/90 z-50 relative shrink-0">
              <div className="text-[13px] font-bold tracking-tight font-display">
                {deviceType === "ios" ? currentTime.split(" ")[0] : currentTime}
              </div>

              {/* Notch / Dynamic Island Simulator */}
              {deviceType === "ios" ? (
                <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-[110px] h-6 bg-black rounded-full flex items-center justify-end px-3">
                  {/* Camera lens glimmer */}
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800/40" />
                </div>
              ) : (
                <div className="absolute left-1/2 -translate-x-1/2 top-2 w-4.5 h-4.5 bg-black rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-zinc-900" />
                </div>
              )}

              {/* Status Bar Icons */}
              <div className="flex items-center gap-1.5 text-white/80">
                <Signal className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/65">LTE</span>
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <Battery className="w-4 h-4 text-white/90" />
                  <span className="text-[10px] font-mono font-bold text-white/90">{batteryLevel}%</span>
                </div>
              </div>
            </div>

            {/* Simulated Active Carrier Banner */}
            <div className="h-5 bg-gradient-to-r from-[#00B140] to-emerald-800 flex items-center justify-between px-6 text-[10px] font-medium text-white shadow-sm shrink-0 z-40">
              <div className="flex items-center gap-1 font-sans">
                <Shield className="w-3 h-3" />
                <span>M-PESA Secure Analyzer</span>
              </div>
              <span className="font-mono text-[9px] tracking-wider text-white/90">Safaricom LTE-K</span>
            </div>

            {/* Inner App Container (Scrollable screen) */}
            <div className="flex-1 overflow-hidden relative bg-[#090909] flex flex-col">
              {activeNotification && (
                <div 
                  onClick={() => setActiveNotification(null)}
                  className="absolute top-2 left-2 right-2 bg-slate-950/95 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-3 shadow-2xl z-[9999] flex items-start gap-2.5 cursor-pointer transition-all duration-300 active:scale-95 animate-slideIn"
                  style={{ animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#00B140] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-inner">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#00B140] uppercase tracking-wider">Safaricom M-PESA</span>
                      <span className="text-[8px] text-white/40 font-bold">now</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-200 mt-0.5 line-clamp-2 leading-relaxed font-mono">
                      {activeNotification.body}
                    </p>
                  </div>
                </div>
              )}
              {children}
            </div>

            {/* Bottom Home Indicator Bar (iOS-style) or Nav Bar (Android-style) */}
            {deviceType === "ios" ? (
              <div className="h-5 bg-[#090909] flex items-center justify-center shrink-0 z-50 pb-1 relative">
                <div className="w-32 h-1.5 bg-zinc-800 rounded-full" />
              </div>
            ) : (
              <div className="h-8 bg-[#090909] border-t border-white/5 flex items-center justify-around text-white/40 shrink-0 z-50 relative text-[10px] font-semibold">
                <button className="hover:text-white/70">◀ Back</button>
                <button className="hover:text-white/70">● Home</button>
                <button className="hover:text-white/70">■ Menu</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
