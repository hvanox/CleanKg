"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import { categoryLabel, recordsWord } from "@/i18n/messages";
import { fmt } from "@/lib/format";
import { useCategories, useReports } from "@/lib/queries";
import { STATUSES, type Status } from "@/lib/types";
import { MapView } from "./map/MapView";
import { ButtonLink } from "./ui/Button";
import { StatusChip } from "./ui/Chips";
import { EmptyState, ErrorState, Skeleton } from "./ui/States";

/** S1 public map. */
export function MapScreen() {
  const { locale, m } = useI18n();
  const [status, setStatus] = useState<Status | "">("");
  const [category, setCategory] = useState("");
  const categories = useCategories();
  const reports = useReports({ status: status || undefined, category: category || undefined });
  const features = useMemo(() => reports.data?.features ?? [], [reports.data]);
  const count = features.length;

  return (
    <div className="kg-page">
      <div className="kg-page__head">
        <h1 className="kg-display">{m.map.title}</h1>
        <ButtonLink href="/new" variant="primary" island>
          {m.map.cta}
        </ButtonLink>
      </div>

      <p className="kg-mono-data kg-muted kg-data-line">
        {reports.data
          ? fmt(m.demo.dataLine, { count, records: recordsWord(locale, count) })
          : null}
      </p>

      <div className="kg-filters" role="group" aria-label={m.map.filtersLabel}>
        <div className="kg-field">
          <label className="kg-label" htmlFor="filter-status">
            {m.map.filterStatus}
          </label>
          <select
            id="filter-status"
            className="kg-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as Status | "")}
          >
            <option value="">{m.map.allStatuses}</option>
            {STATUSES.map((code) => (
              <option key={code} value={code}>
                {m.status[code]}
              </option>
            ))}
          </select>
        </div>
        <div className="kg-field">
          <label className="kg-label" htmlFor="filter-category">
            {m.map.filterCategory}
          </label>
          <select
            id="filter-category"
            className="kg-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{m.map.allCategories}</option>
            {(categories.data?.items ?? []).map((item) => (
              <option key={item.code} value={item.code}>
                {categoryLabel(item, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="kg-map-wrap">
        <MapView features={features} />
        {reports.isPending ? (
          <div className="kg-map-overlay kg-map-overlay--fill">
            <Skeleton label={m.map.loading} className="kg-skeleton--fill" />
          </div>
        ) : null}
        {reports.isError ? (
          <div className="kg-map-overlay">
            <ErrorState error={reports.error} onRetry={() => void reports.refetch()} />
          </div>
        ) : null}
        {reports.data && !reports.isError && count === 0 ? (
          <div className="kg-map-overlay">
            <EmptyState>{m.map.empty}</EmptyState>
          </div>
        ) : null}
      </div>

      <section className="kg-legend" aria-labelledby="legend-title">
        <h2 className="kg-label" id="legend-title">
          {m.map.legend}
        </h2>
        <ul className="kg-legend__list">
          {STATUSES.map((code) => (
            <li key={code}>
              <StatusChip status={code} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
