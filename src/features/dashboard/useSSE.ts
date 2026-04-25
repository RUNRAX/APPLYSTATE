"use client";
import { useEffect, useState } from 'react';

export function useSSE() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/sse/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'connected') {
        setEvents(prev => [data, ...prev].slice(0, 10)); // Keep last 10
      }
    };

    return () => eventSource.close();
  }, []);

  return events;
}
