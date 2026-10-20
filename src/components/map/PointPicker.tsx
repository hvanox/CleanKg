"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_START,
  MAP_VIEW_BOUNDS,
  OSM_COPYRIGHT_URL,
  TILE_URL,
} from "@/lib/config";
import { loadLeaflet, prefersReducedMotion, type LeafletModule } from "./leaflet";
import { pinMarkerHtml } from "./markers";

interface Ready {
  L: LeafletModule;
  map: Leaflet.Map;
}

/** S2 point picker: click the map to set the point. Typing coordinates is the keyboard path (fields next to the map). */
export function PointPicker({
  point,
  onPick,
}: {
  point: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const { m } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const attributionRef = useRef(m.map.attribution);
  useEffect(() => {
    onPickRef.current = onPick;
    attributionRef.current = m.map.attribution;
  });
  const [ready, setReady] = useState<Ready | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: Leaflet.Map | null = null;
    void loadLeaflet().then((L) => {
      const container = containerRef.current;
      if (cancelled || !container) return;
      const reduced = prefersReducedMotion();
      const map = L.map(container, {
        center: [MAP_START.lat, MAP_START.lng],
        zoom: MAP_START.zoom,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        maxBounds: MAP_VIEW_BOUNDS,
        maxBoundsViscosity: 1,
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: !reduced,
        fadeAnimation: !reduced,
        markerZoomAnimation: !reduced,
      });
      L.tileLayer(TILE_URL, { maxZoom: MAP_MAX_ZOOM }).addTo(map);
      L.control
        .attribution({ prefix: false, position: "bottomright" })
        .addAttribution(
          `<a href="${OSM_COPYRIGHT_URL}" target="_blank" rel="noreferrer">${attributionRef.current}</a>`,
        )
        .addTo(map);
      map.on("click", (event) => {
        onPickRef.current(
          Number(event.latlng.lat.toFixed(4)),
          Number(event.latlng.lng.toFixed(4)),
        );
      });
      created = map;
      setReady({ L, map });
    });
    return () => {
      cancelled = true;
      markerRef.current = null;
      setReady(null);
      created?.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const control = ready.L.control
      .zoom({ position: "topleft", zoomInTitle: m.map.zoomIn, zoomOutTitle: m.map.zoomOut })
      .addTo(ready.map);
    return () => {
      control.remove();
    };
  }, [ready, m.map.zoomIn, m.map.zoomOut]);

  useEffect(() => {
    if (!ready) return;
    const { L, map } = ready;
    if (!point) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const latlng = L.latLng(point.lat, point.lng);
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "kg-marker kg-marker--active", iconSize: undefined, html: pinMarkerHtml() }),
      }).addTo(map);
    }
    if (!map.getBounds().contains(latlng)) map.panTo(latlng);
  }, [ready, point]);

  return <div ref={containerRef} className="kg-map kg-map--picker" role="region" aria-label={m.create.mapLabel} />;
}
