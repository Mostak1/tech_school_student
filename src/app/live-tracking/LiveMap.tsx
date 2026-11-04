'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Interop with the Google Maps JS API, which has no bundled types here.

import React, { useEffect, useRef, useState } from 'react';

export interface MapPoint {
  lat: number;
  lng: number;
  name?: string;
  kind: 'bus' | 'user' | 'stop';
}

// Load the Google Maps JS API once per page, shared across mounts.
let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).google?.maps) return Promise.resolve();
  if (!mapsPromise) {
    mapsPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        mapsPromise = null;
        reject(new Error('maps_load_failed'));
      };
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

// Colors per marker kind.
// bus (live) = red, user's stop = blue, other stops = gray.
const PIN_COLOR: Record<MapPoint['kind'], string> = {
  bus: '#EF4444',
  user: '#2563EB',
  stop: '#9CA3AF',
};

// Themed teardrop pin as a data-URI SVG (white center dot).
const pinSvg = (color: string) =>
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
       <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="${color}"/>
       <circle cx="16" cy="16" r="5.5" fill="#ffffff"/>
     </svg>`
  );

/**
 * Interactive map that plots station points (stops), the student's stop and the
 * live bus by their lat/lng, fitting the view to all of them.
 */
export default function LiveMap({
  apiKey,
  points,
  className,
  onRefresh,
  isRefreshing,
}: {
  apiKey: string;
  points: MapPoint[];
  className?: string;
  // Optional manual refresh handler (e.g. refetch the tracking session)
  onRefresh?: () => void;
  // Disables + spins the refresh button while a refresh is in flight
  isRefreshing?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const legendAddedRef = useRef(false);
  const didFitRef = useRef(false);
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const g = (window as any).google;

    // Coerce and drop any point without valid numeric coordinates
    const valid = points
      .map((p) => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (valid.length === 0) return;

    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(containerRef.current, {
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        // Force on: touch devices hide this by default, relying on pinch-to-zoom only
        zoomControl: true,
        // Tap to open full-screen, close to return to the same view
        fullscreenControl: true,
        // One-finger pan on mobile
        gestureHandling: 'greedy',
      });
      infoRef.current = new g.maps.InfoWindow();
    }

    // Legend + refresh docked as map controls, via Google's Map#controls API.
    // Controls live inside the map's own element, so — unlike a page-level
    // absolute overlay — they stay visible when the map goes full screen.
    if (!legendAddedRef.current) {
      const legend = document.createElement('div');
      legend.style.cssText =
        'background:rgba(255,255,255,0.95);border:1px solid #EAEAEA;' +
        'border-radius:8px;padding:8px 12px;margin:10px;box-shadow:0 1px 4px rgba(0,0,0,0.15);' +
        'font:12px system-ui;color:#374151;display:flex;flex-direction:column;gap:4px;';
      legend.innerHTML = [
        ['#EF4444', 'Bus'],
        ['#2563EB', 'Your stop'],
        ['#9CA3AF', 'Other stops'],
      ]
        .map(
          ([color, label]) =>
            `<span style="display:flex;align-items:center;gap:8px">
               <span style="width:10px;height:10px;border-radius:9999px;background:${color}"></span>${label}
             </span>`
        )
        .join('');
      mapRef.current.controls[g.maps.ControlPosition.LEFT_BOTTOM].push(legend);
      legendAddedRef.current = true;
    }

    if (!refreshButtonRef.current && onRefreshRef.current) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = 'Refresh';
      btn.style.cssText =
        'background:#ffffff;border:1px solid #EAEAEA;border-radius:8px;' +
        'width:36px;height:36px;margin:10px;box-shadow:0 1px 4px rgba(0,0,0,0.15);' +
        'display:flex;align-items:center;justify-content:center;cursor:pointer;';
      btn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22577A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>';
      btn.addEventListener('click', () => onRefreshRef.current?.());
      mapRef.current.controls[g.maps.ControlPosition.RIGHT_BOTTOM].push(btn);
      refreshButtonRef.current = btn;
    }

    // Reset markers each update (bus moves; stops may load coords later)
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new g.maps.LatLngBounds();
    valid.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        // Name shown on hover / tap only — no always-on label to avoid overlap
        title: p.name,
        icon: {
          url: pinSvg(PIN_COLOR[p.kind]),
          scaledSize: new g.maps.Size(32, 42),
          anchor: new g.maps.Point(16, 42),
        },
        zIndex: p.kind === 'bus' ? 3 : p.kind === 'user' ? 2 : 1,
      });

      // Tap/click shows the stop name in a small info window
      if (p.name) {
        marker.addListener('click', () => {
          if (!infoRef.current) {
            infoRef.current = new g.maps.InfoWindow();
          }
          infoRef.current.setContent(
            `<div style="font:600 12px system-ui;color:#1f2937;padding:2px">${p.name}</div>`
          );
          infoRef.current.open({ map: mapRef.current, anchor: marker });
        });
      }

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    // Fit/center only on the very first render of points — a later refresh
    // (new lat/lng) must move markers without resetting the user's own pan/zoom.
    if (!didFitRef.current) {
      if (valid.length === 1) {
        mapRef.current.setCenter({ lat: valid[0].lat, lng: valid[0].lng });
        mapRef.current.setZoom(15);
      } else {
        mapRef.current.fitBounds(bounds, 48);
      }
      didFitRef.current = true;
    }
  }, [ready, points]);

  // Reflect the in-flight refresh state on the button (disabled + spinning),
  // kept separate from the marker-rebuild effect above.
  useEffect(() => {
    const btn = refreshButtonRef.current;
    if (!btn) return;
    const svg = btn.querySelector('svg');
    btn.disabled = !!isRefreshing;
    btn.style.opacity = isRefreshing ? '0.5' : '1';
    btn.style.cursor = isRefreshing ? 'not-allowed' : 'pointer';
    svg?.classList.toggle('live-map-spin', !!isRefreshing);
  }, [isRefreshing, ready]);

  if (failed) {
    // Signal the parent to use its iframe fallback
    return null;
  }

  return (
    <>
      {/* Spin animation for the refresh icon while a refetch is in flight */}
      <style>{`@keyframes live-map-spin{to{transform:rotate(360deg)}}.live-map-spin{animation:live-map-spin 0.8s linear infinite}`}</style>
      <div ref={containerRef} className={className} />
    </>
  );
}
