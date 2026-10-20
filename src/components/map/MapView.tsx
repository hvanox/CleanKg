"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type * as Leaflet from "leaflet";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n";
import { categoryLabel } from "@/i18n/messages";
import { authorLabel } from "@/lib/author";
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_START,
  MAP_VIEW_BOUNDS,
  OSM_COPYRIGHT_URL,
  TILE_URL,
} from "@/lib/config";
import { fmt, formatDateTime } from "@/lib/format";
import type { Report, ReportFeature } from "@/lib/types";
import { DemoChip, StatusChip } from "@/components/ui/Chips";
import { loadLeaflet, prefersReducedMotion, tokenPx, type LeafletModule } from "./leaflet";
import { clusterMarkerHtml, statusMarkerHtml } from "./markers";

interface Ready {
  L: LeafletModule;
  map: Leaflet.Map;
  group: Leaflet.MarkerClusterGroup;
}

interface OpenPopup {
  report: Report;
  el: HTMLElement;
  popup: Leaflet.Popup;
}

const ACTIVE_CLASS = "kg-marker--active";

function PopupContent({ report }: { report: Report }) {
  const { locale, m } = useI18n();
  return (
    <div className="kg-popup-content">
      <StatusChip status={report.status} />
      <dl className="kg-dl">
        <dt>{m.map.popupCategory}</dt>
        <dd>{categoryLabel(report.category, locale)}</dd>
        <dt>{m.map.popupDate}</dt>
        <dd>
          <time className="kg-mono" dateTime={report.created_at}>
            {formatDateTime(report.created_at)}
          </time>{" "}
          {report.is_demo ? <DemoChip /> : null}
        </dd>
        <dt>{m.map.popupAuthor}</dt>
        <dd>{authorLabel(report, m.anonymousAuthor)}</dd>
      </dl>
      <Link href={`/r/${report.id}`} className="kg-btn kg-btn--secondary">
        {m.map.popupOpen}
      </Link>
    </div>
  );
}

/** S1 map: Leaflet with OpenStreetMap tiles; markers are clustered in the browser (the API returns points, see api/README). */
export function MapView({ features }: { features: ReportFeature[] }) {
  const { locale, m } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [open, setOpen] = useState<OpenPopup | null>(null);
  const fitted = useRef(false);
  const messagesRef = useRef(m);
  useEffect(() => {
    messagesRef.current = m;
  }, [m]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let created: Leaflet.Map | null = null;
    void loadLeaflet({ cluster: true }).then((L) => {
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
          `<a href="${OSM_COPYRIGHT_URL}" target="_blank" rel="noreferrer">${messagesRef.current.map.attribution}</a>`,
        )
        .addTo(map);
      const group = L.markerClusterGroup({
        showCoverageOnHover: false,
        animate: !reduced,
        animateAddingMarkers: false,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const current = messagesRef.current;
          return L.divIcon({
            className: "kg-cluster",
            iconSize: undefined,
            html: clusterMarkerHtml(
              count,
              current.demo.chip,
              fmt(current.map.clusterLabel, { count }),
            ),
          });
        },
      });
      map.addLayer(group);
      created = map;
      setReady({ L, map, group });
    });
    return () => {
      cancelled = true;
      setReady(null);
      setOpen(null);
      fitted.current = false;
      created?.remove();
    };
  }, []);

  // Zoom control with titles in the current locale.
  useEffect(() => {
    if (!ready) return;
    const control = ready.L.control
      .zoom({ position: "topleft", zoomInTitle: m.map.zoomIn, zoomOutTitle: m.map.zoomOut })
      .addTo(ready.map);
    return () => {
      control.remove();
    };
  }, [ready, m.map.zoomIn, m.map.zoomOut]);

  // Markers.
  useEffect(() => {
    if (!ready) return;
    const { L, map, group } = ready;
    const current = messagesRef.current;
    group.clearLayers();
    const popupOffset = L.point(0, -tokenPx("--kg-target-touch") / 2);
    const markers = features.map((feature) => {
      const report = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;
      const label = fmt(current.map.markerLabel, {
        status: current.status[report.status],
        category: categoryLabel(report.category, locale),
      });
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "kg-marker",
          iconSize: undefined,
          html: statusMarkerHtml(report.status, label),
        }),
        keyboard: true,
      });
      const el = document.createElement("div");
      marker.bindPopup(el, { offset: popupOffset, className: "kg-popup" });
      marker.on("popupopen", (event) => {
        marker.getElement()?.classList.add(ACTIVE_CLASS);
        setOpen({ report, el, popup: event.popup });
      });
      marker.on("popupclose", () => {
        marker.getElement()?.classList.remove(ACTIVE_CLASS);
        setOpen((prev) => (prev?.el === el ? null : prev));
      });
      return marker;
    });
    group.addLayers(markers);
    if (!fitted.current && markers.length > 0) {
      const pad = tokenPx("--kg-space-5");
      map.fitBounds(group.getBounds(), { padding: L.point(pad, pad), maxZoom: MAP_START.zoom });
      fitted.current = true;
    }
  }, [ready, features, locale]);

  // The popup is sized before React fills it; ask Leaflet to measure again.
  useLayoutEffect(() => {
    open?.popup.update();
  }, [open, locale]);

  const portal = useMemo(
    () => (open ? createPortal(<PopupContent report={open.report} />, open.el) : null),
    [open],
  );

  return (
    <>
      <div ref={containerRef} className="kg-map" role="region" aria-label={m.map.regionLabel} />
      {portal}
    </>
  );
}
