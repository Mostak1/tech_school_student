'use client';

/**
 * Standalone Live Bus Tracking — identical flow to Flutter.
 *
 *   button → POST /transportation/live-tracking/link (user_id)
 *          → token → /live-tracking#tk=<TOKEN>
 *          → GET /transportation/live-tracking/session  (X-Tracking-Token)
 *          → bus / location / ETA → this UI, polled at poll_interval_sec
 *
 * Token-only: there is NO authenticated fallback. The page's sole data source
 * is the token session endpoint, exactly like the app. It renders outside the
 * (dashboard) route group, so no sidebar / auth guard / school-code.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { GrLocation } from 'react-icons/gr';
import { BiBus, BiCurrentLocation, BiMapPin } from 'react-icons/bi';
import { useTrackingSession } from '@/lib/api/student/queryHooks';
import { TrackingSessionError } from '@/lib/api/student/functions';
import { useTranslate } from '@/components/hooks/useTranslate';
import LiveMap, { MapPoint } from './LiveMap';

// Google Maps embed centered on the coordinates, with a marker. Uses the
// official Embed API when a key is available, otherwise the keyless embed.
const mapEmbedUrl = (lat: number, lng: number, apiKey: string) =>
  apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=en&output=embed`;

// Decode the base64-encoded Google Maps API key.
const decodeApiKey = (encoded?: string): string => {
  if (!encoded) return '';
  try {
    return atob(encoded);
  } catch {
    return '';
  }
};

// Format ISO updated_at -> "h:mm AM/PM" (falls back to raw string)
const formatUpdatedAt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export default function LiveTrackingPage() {
  const translate = useTranslate();

  // Tracking token from the URL hash (#tk=<TOKEN>). The hash is never sent to
  // the server, so it is read client-side after mount (SSR-safe). It is kept in
  // the hash (not stripped) so a page refresh resumes tracking; it is never
  // written to localStorage/query params or logged.
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  useEffect(() => {
    const readToken = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const tk = new URLSearchParams(hash).get('tk');
      setToken(tk && tk.trim() ? tk : null);
      setTokenChecked(true);
    };
    readToken();
    window.addEventListener('hashchange', readToken);
    return () => window.removeEventListener('hashchange', readToken);
  }, []);

  // Single data source: the token session endpoint (same as the app).
  const {
    data: sessionRes,
    isLoading: sessionLoading,
    isFetching: sessionFetching,
    error: sessionErrorRaw,
    refetch: refetchSession,
  } = useTrackingSession(token);
  const session = sessionRes?.data || null;
  const sessionStatus =
    sessionErrorRaw instanceof TrackingSessionError
      ? sessionErrorRaw.status
      : null;

  // Build the view model from the session payload
  const vm = useMemo(() => {
    if (!session || session.tracking_status === 'no_trip') return null;

    const stops = session.stops || [];
    const isReached = (s: (typeof stops)[number]) =>
      s.actual_time === 'Reached' ||
      (!!s.actual_time && s.actual_time !== 'Pending');
    const reached = stops.filter(isReached);
    const lastReached = reached[reached.length - 1] || null;
    const us = session.user_stop;
    const loc = session.location;

    // Prefer the backend's display-ready previous/next station names — they
    // track the route's actual progress, unlike user_stop which stays fixed
    // on the student's own stop even after it has been reached.
    const nextLocationName =
      session.next_location && session.next_location !== '-'
        ? session.next_location
        : '';
    const nextStop = nextLocationName
      ? stops.find((s) => s.name === nextLocationName) || null
      : null;

    return {
      schoolName: session.school?.name || '',
      routeName: session.route?.name || '',
      vehicleNumber: session.bus?.vehicle_number || '—',
      busName: session.bus?.name || '',
      previousName:
        (session.previous_location && session.previous_location !== '-'
          ? session.previous_location
          : '') ||
        session.last_reached_stop?.name ||
        lastReached?.name ||
        '—',
      lastUpdated: loc?.updated_at
        ? formatUpdatedAt(loc.updated_at)
        : lastReached?.actual_time || '—',
      nextName: nextLocationName || us?.name || '—',
      nextTime: nextStop
        ? nextStop.estimated_time && nextStop.estimated_time !== 'Reached'
          ? nextStop.estimated_time
          : nextStop.scheduled_time
        : us?.estimated_time && us.estimated_time !== 'Reached'
          ? us.estimated_time
          : us?.scheduled_time || '—',
      nextReached: nextStop
        ? nextStop.estimated_time === 'Reached' ||
          nextStop.actual_time === 'Reached'
        : !!us &&
          (us.estimated_time === 'Reached' || us.actual_time === 'Reached'),
      mapCenter: loc ? { lat: loc.latitude, lng: loc.longitude } : null,
      // Map markers: live bus + station points (stops) that have coordinates.
      // Stops carry lat/lng only where the school has filled pickup_points.
      points: (
        [
          ...(loc
            ? [
                {
                  lat: Number(loc.latitude),
                  lng: Number(loc.longitude),
                  name: session.bus?.name || 'Bus',
                  kind: 'bus' as const,
                },
              ]
            : []),
          ...stops.map((s) => ({
            lat: Number(s.latitude),
            lng: Number(s.longitude),
            name: s.name,
            kind: (s.is_user_stop ? 'user' : 'stop') as MapPoint['kind'],
          })),
        ] as MapPoint[]
      ).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
      apiKey: decodeApiKey(session.school?.google_maps_api_key),
      schoolMapEmbed: session.school?.google_map_link || '',
      isLive: session.tracking_status === 'live' && !loc?.is_stale,
    };
  }, [session]);

  const isLoading = !tokenChecked || (!!token && sessionLoading);

  // Distinct states (never redirect to login)
  const missingToken = tokenChecked && !token;
  const invalidLink = sessionStatus === 401 || missingToken;
  const expiredLink = sessionStatus === 410;
  const hasContent = !isLoading && !invalidLink && !expiredLink && !!vm;
  const noTrip =
    !isLoading &&
    !invalidLink &&
    !expiredLink &&
    !vm &&
    !!session; // session loaded but no running trip

  return (
    <main className="min-h-screen bg-[#F2F5F7]">
      {/* Header — h 104, border #EAEAEA, px 16 */}
      <header className="bg-white border-b border-[#EAEAEA] px-4">
        <div className="max-w-[1224px] mx-auto w-full min-h-[104px] flex items-center justify-between gap-4 py-4">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-6">
              {translate('liveTracking') || 'Live Bus Tracking'}
            </h1>
            {hasContent && (vm!.schoolName || vm!.routeName) && (
              <p className="text-xs sm:text-sm text-gray-600 leading-6 truncate">
                {vm!.schoolName && (
                  <span className="font-semibold text-gray-800">
                    {vm!.schoolName}
                  </span>
                )}
                {vm!.routeName
                  ? `${vm!.schoolName ? ' - ' : ''}${
                      translate('routeName') || 'Route Name:'
                    } ${vm!.routeName}`
                  : ''}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1224px] mx-auto px-4 py-4 sm:py-6">
        {/* Loading */}
        {isLoading && (
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-14 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-[420px] bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Invalid / missing token (401) */}
        {invalidLink && (
          <StateCard
            title={translate('trackingLinkInvalid') || 'Tracking link invalid'}
            subtitle={
              translate('openTrackingFromApp') ||
              'Please open live tracking again from the app.'
            }
            tone="error"
          />
        )}

        {/* Expired link (410) */}
        {expiredLink && (
          <StateCard
            title={translate('trackingLinkExpired') || 'Tracking link expired'}
            subtitle={
              translate('openTrackingFromApp') ||
              'Please open live tracking again from the app.'
            }
            tone="error"
          />
        )}

        {/* No running trip */}
        {noTrip && (
          <StateCard
            title={
              translate('busHasNotStarted') || 'Your bus hasn’t started yet'
            }
            subtitle={
              translate('busWillAppearWhenTripStarts') ||
              'Live location appears once your bus starts its trip.'
            }
            tone="muted"
          />
        )}

        {/* Content */}
        {hasContent && (
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-4 flex flex-col gap-6">
            {/* Previous / Next pickup cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Previous */}
              <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg p-3 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-lg bg-[#22577A] flex items-center justify-center shrink-0">
                    <GrLocation className="w-5 h-5 text-white" />
                  </span>
                  <div className="min-w-0 flex flex-col gap-1">
                    <p className="text-xs text-gray-500 leading-none">
                      {translate('previousPickupLocation') ||
                        'Previous Pickup Location'}
                    </p>
                    <p className="text-sm font-semibold text-[#22577A] truncate">
                      {vm!.previousName}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#EAEAEA]" />
                <p className="text-xs text-gray-500">
                  {translate('lastUpdatedOn') || 'Last Updated On'}:{' '}
                  <span className="font-semibold text-gray-800">
                    {vm!.lastUpdated}
                  </span>
                </p>
              </div>

              {/* Next */}
              <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg p-3 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-lg bg-[#22577A] flex items-center justify-center shrink-0">
                    <BiMapPin className="w-5 h-5 text-white" />
                  </span>
                  <div className="min-w-0 flex flex-col gap-1">
                    <p className="text-xs text-gray-500 leading-none">
                      {translate('nextPickupLocation') || 'Next Pickup Location'}
                    </p>
                    <p className="text-sm font-semibold text-[#22577A] truncate">
                      {vm!.nextName}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#EAEAEA]" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 bg-white border border-[#EAEAEA] rounded px-2 py-1">
                    {translate('estimatesPickup') || 'Estimates Pickup'}:{' '}
                    <span className="font-semibold text-gray-800">
                      {vm!.nextTime}
                    </span>
                  </span>
                  {vm!.nextReached && (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#57CC99] rounded px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {translate('reached') || 'Reached'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bus info strip */}
            <div className="bg-white border border-[#EAEAEA] rounded-lg px-3 py-3 text-sm text-gray-700">
              {vm!.busName && (
                <>
                  {translate('busName') || 'Bus Name:'}{' '}
                  <span className="font-bold text-gray-900">{vm!.busName}</span>
                  <span className="mx-2 text-gray-300">|</span>
                </>
              )}
              {translate('busVehicleNo') || 'Bus Vehicle No:'}{' '}
              <span className="font-bold text-gray-900">
                {vm!.vehicleNumber}
              </span>
            </div>

            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden border border-[#EAEAEA]">
              {/* Docked at top-start: the map's own fullscreen control sits
                  top-end (Google Maps default), so this must not share that corner. */}
              {vm!.isLive ? (
                <span className="absolute top-3 start-3 z-10 inline-flex items-center gap-1 bg-[#83B807] border border-[#83B807] text-white text-xs font-medium rounded-full px-2 py-0.5 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {translate('liveTracking') || 'Live Tracking'}
                </span>
              ) : (
                vm!.mapCenter && (
                  <span className="absolute top-3 start-3 z-10 inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-medium rounded-full px-2 py-0.5 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    {translate('waitingForBusLocation') || 'Waiting…'}
                  </span>
                )
              )}

              {vm!.apiKey && vm!.points.length > 0 ? (
                // Interactive map: bus + station points plotted by lat/lng.
                // Legend + refresh render as map controls (LiveMap), so they
                // stay visible when the map goes full screen.
                <LiveMap
                  apiKey={vm!.apiKey}
                  points={vm!.points}
                  className="w-full h-[400px] md:h-[520px] lg:h-[639px]"
                  onRefresh={() => refetchSession()}
                  isRefreshing={sessionFetching}
                />
              ) : vm!.mapCenter ? (
                <iframe
                  title="Live bus location"
                  key={`${vm!.mapCenter.lat},${vm!.mapCenter.lng}`}
                  src={mapEmbedUrl(
                    vm!.mapCenter.lat,
                    vm!.mapCenter.lng,
                    vm!.apiKey
                  )}
                  className="w-full h-[400px] md:h-[520px] lg:h-[639px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : vm!.schoolMapEmbed ? (
                <iframe
                  title="School location"
                  src={vm!.schoolMapEmbed}
                  className="w-full h-[400px] md:h-[520px] lg:h-[639px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="h-[400px] md:h-[520px] lg:h-[639px] flex items-center justify-center text-center px-4">
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <BiCurrentLocation className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {translate('waitingForBusLocation') ||
                        'Waiting for bus location…'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {translate('busOfflineDescription') ||
                        'The bus is currently offline. The map updates when it comes back online.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Full-width message card for the non-content states.
 */
function StateCard({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: 'error' | 'muted';
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-10 text-center">
      <div
        className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
          tone === 'error' ? 'bg-red-50' : 'bg-gray-100'
        }`}
      >
        <BiBus
          className={`w-7 h-7 ${
            tone === 'error' ? 'text-red-500' : 'text-gray-400'
          }`}
        />
      </div>
      <p className="text-gray-900 font-semibold mb-1">{title}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}
