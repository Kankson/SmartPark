"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, LocateFixed, Route, Sparkles } from "lucide-react";
import maplibregl from "maplibre-gl";

import { StatusPill } from "@/components/status-pill";
import { Card } from "@/components/ui/card";
import { formatMoney, type ZoneWithAvailability } from "@/server/domain";

function markerColour(zone: ZoneWithAvailability) {
  if (!zone.isActive) return "#6B7280";
  if (zone.availableSpaces === 0) return "#DC2626";
  if (zone.availableSpaces <= 3) return "#D97706";
  return "#0E9F6E";
}

type SortMode = "smart" | "closest" | "cheapest";
type UserLocation = { latitude: number; longitude: number };

function distanceInKm(from: UserLocation, zone: ZoneWithAvailability) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(zone.latitude - from.latitude);
  const longitudeDelta = toRadians(zone.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const endLatitude = toRadians(zone.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function confidenceLabel(zone: ZoneWithAvailability) {
  if (zone.availabilityConfidence === "verified") return "Warden verified";
  if (zone.availabilityConfidence === "estimated") return "Session estimate";
  return "Limited signal";
}

export function ZoneMap({ zones }: { zones: ZoneWithAvailability[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [mapIssue, setMapIssue] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    setMapIssue(false);

    const map = new maplibregl.Map({
      container: mapRef.current,
      center: [-0.2008, 5.5572],
      zoom: 13,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "OpenStreetMap contributors"
          }
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }]
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => setMapIssue(true));

    const resize = () => map.resize();
    const resizeTimers = [120, 420, 900].map((delay) => window.setTimeout(resize, delay));
    map.once("load", resize);
    window.addEventListener("resize", resize);

    for (const zone of zones) {
      const marker = document.createElement("a");
      marker.href = `/driver/book/${zone.id}`;
      marker.className =
        "parking-marker grid h-9 w-9 place-items-center rounded-full border-2 border-white font-bold text-white shadow-lg";
      marker.style.backgroundColor = markerColour(zone);
      marker.textContent = zone.code.slice(0, 1);
      marker.setAttribute("aria-label", `Book ${zone.name}`);

      new maplibregl.Marker({ element: marker })
        .setLngLat([zone.longitude, zone.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<strong>${zone.name}</strong><br/>${zone.address}<br/>${zone.availableSpaces}/${zone.totalSpaces} spaces`,
          ),
        )
        .addTo(map);
    }

    return () => {
      resizeTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", resize);
      map.remove();
    };
  }, [zones]);

  const rankedZones = useMemo(() => {
    const rows = zones.map((zone) => ({
      ...zone,
      distanceKm: userLocation ? distanceInKm(userLocation, zone) : undefined
    }));

    return rows.sort((a, b) => {
      if (sortMode === "cheapest") {
        return a.hourlyRateMinor - b.hourlyRateMinor || b.availableSpaces - a.availableSpaces;
      }
      if (sortMode === "closest" && a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm || b.availableSpaces - a.availableSpaces;
      }

      const confidenceWeight = { verified: 14, estimated: 7, limited: 0 } as const;
      const aDistanceWeight = a.distanceKm === undefined ? 0 : Math.max(0, 12 - a.distanceKm * 4);
      const bDistanceWeight = b.distanceKm === undefined ? 0 : Math.max(0, 12 - b.distanceKm * 4);
      const aScore =
        (a.availableSpaces / Math.max(1, a.totalSpaces)) * 60 +
        confidenceWeight[a.availabilityConfidence] +
        aDistanceWeight -
        a.hourlyRateMinor / 100;
      const bScore =
        (b.availableSpaces / Math.max(1, b.totalSpaces)) * 60 +
        confidenceWeight[b.availabilityConfidence] +
        bDistanceWeight -
        b.hourlyRateMinor / 100;
      return bScore - aScore;
    });
  }, [sortMode, userLocation, zones]);

  const bestZone = rankedZones.find((zone) => zone.isActive && zone.availableSpaces > 0);
  const filtered = rankedZones.filter((zone) =>
    `${zone.name} ${zone.address}`.toLowerCase().includes(query.toLowerCase()),
  );

  function requestCurrentLocation(nextMode: SortMode = "smart") {
    setSortMode(nextMode);
    setLocationError("");
    if (userLocation) return;
    if (!("geolocation" in navigator)) {
      setLocationError("Location is not available on this phone.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Location permission was not granted. Smart ranking still works without it.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]" data-motion="stagger">
      <div className="relative self-start overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
        <div ref={mapRef} className="h-[420px] min-h-[360px] w-full" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-ink/10 bg-white/95 px-3 py-2 text-sm font-semibold text-ink shadow-panel">
          Live city-centre zones
        </div>
        {mapIssue ? (
          <div className="absolute bottom-4 left-4 right-4 rounded-md border border-caution/30 bg-white/95 px-3 py-2 text-sm text-asphalt shadow-panel">
            Map tiles are slow or offline. The ranked zone list still works.
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        {bestZone ? (
          <div className="rounded-lg border border-mint/20 bg-ink p-4 text-white shadow-panel" data-lift>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-mint">
                  <Sparkles size={16} aria-hidden="true" />
                  Smart pick
                </p>
                <h2 className="mt-2 text-lg font-bold">{bestZone.name}</h2>
                <p className="mt-1 text-sm text-white/70">
                  {bestZone.availableSpaces} spaces open at {formatMoney(bestZone.hourlyRateMinor, bestZone.currency)}/hr.
                </p>
                <p className="mt-2 text-xs font-semibold text-white/55">
                  {confidenceLabel(bestZone)}
                  {bestZone.distanceKm !== undefined ? ` - ${bestZone.distanceKm.toFixed(1)} km away` : ""}
                </p>
              </div>
              <Link
                href={`/driver/book/${bestZone.id}`}
                className="shrink-0 rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-kerb"
              >
                Book
              </Link>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-3 rounded-md border border-ink/10 bg-white p-1 shadow-sm" aria-label="Sort parking zones">
          <button
            type="button"
            onClick={() => setSortMode("smart")}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${sortMode === "smart" ? "bg-ink text-white" : "text-asphalt hover:bg-lane"}`}
          >
            <Sparkles size={15} aria-hidden="true" /> Best
          </button>
          <button
            type="button"
            onClick={() => requestCurrentLocation("closest")}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${sortMode === "closest" ? "bg-ink text-white" : "text-asphalt hover:bg-lane"}`}
          >
            <Route size={15} aria-hidden="true" /> Closest
          </button>
          <button
            type="button"
            onClick={() => setSortMode("cheapest")}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${sortMode === "cheapest" ? "bg-ink text-white" : "text-asphalt hover:bg-lane"}`}
          >
            <CircleDollarSign size={15} aria-hidden="true" /> Cheapest
          </button>
        </div>
        <button
          type="button"
          onClick={() => requestCurrentLocation(sortMode)}
          disabled={locating}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-ink/10 bg-lane px-3 text-sm font-semibold text-ink hover:border-mint/30 disabled:opacity-60"
        >
          <LocateFixed size={16} className="text-mint" aria-hidden="true" />
          {locating ? "Finding your location..." : userLocation ? "Location added to ranking" : "Use my location"}
        </button>
        {locationError ? <p className="text-sm text-breach">{locationError}</p> : null}
        <input
          className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
          placeholder="Search zone or address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="grid gap-3">
          {filtered.map((zone) => (
            <Card key={zone.id} className={`p-4 ${zone.id === bestZone?.id ? "border-mint/35" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink">{zone.name}</h2>
                    {zone.id === bestZone?.id ? (
                      <span className="rounded-md bg-mint/10 px-2 py-1 text-xs font-bold uppercase text-mint">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-asphalt/70">{zone.address}</p>
                  <p className="mt-2 text-xs font-semibold text-asphalt/55">{confidenceLabel(zone)}</p>
                </div>
                <StatusPill status={zone.availableSpaces > 0 ? "available" : "unavailable"} />
              </div>
              <dl className={`mt-4 grid gap-3 text-sm ${zone.distanceKm !== undefined ? "grid-cols-3" : "grid-cols-2"}`}>
                <div>
                  <dt className="text-asphalt/60">Price</dt>
                  <dd className="font-semibold text-ink">{formatMoney(zone.hourlyRateMinor, zone.currency)}/hr</dd>
                </div>
                {zone.distanceKm !== undefined ? (
                  <div>
                    <dt className="text-asphalt/60">Distance</dt>
                    <dd className="font-semibold text-ink">{zone.distanceKm.toFixed(1)} km</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-asphalt/60">Available</dt>
                  <dd className="font-semibold text-ink">
                    {zone.availableSpaces}/{zone.totalSpaces}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-kerb">
                <div
                  className={`h-full rounded-full ${zone.availableSpaces === 0 ? "bg-breach" : zone.availableSpaces <= 3 ? "bg-caution" : "bg-mint"}`}
                  style={{ width: `${Math.max(6, Math.round((zone.availableSpaces / zone.totalSpaces) * 100))}%` }}
                />
              </div>
              <Link
                href={`/driver/book/${zone.id}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Book Parking
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
