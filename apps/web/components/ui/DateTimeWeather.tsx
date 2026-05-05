'use client';

import { useState, useEffect } from 'react';
import { Sun, Thermometer, Clock } from 'lucide-react';

export default function DateTimeWeather() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return <div className="h-4 w-32" />; // Return empty placeholder during SSR
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Mock weather data
  const weather = {
    temp: 31,
    condition: 'Cerah Berawan',
    icon: <Sun size={14} className="text-yellow-500" />
  };

  return (
    <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
      {/* Date & Clock */}
      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-brand-text-muted">{formatDate(time)}</span>
        <div className="flex items-center gap-1.5 text-brand-black font-mono tracking-tighter">
          <Clock size={11} className="text-brand-red opacity-80" />
          {formatTime(time)}
        </div>
      </div>

      <div className="w-px h-2.5 bg-gray-200" />

      {/* Weather */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {weather.icon}
          <span className="hidden sm:inline text-brand-black">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-1 text-brand-text-muted">
          <Thermometer size={12} />
          <span>{weather.temp}°C</span>
        </div>
        <div className="hidden xl:flex items-center gap-2 text-brand-text-muted font-medium lowercase italic tracking-normal">
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          Jakarta, Indonesia
        </div>
      </div>
    </div>
  );
}
