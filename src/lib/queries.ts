"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeStatus,
  claimReport,
  createReport,
  fetchCategories,
  fetchOrganisations,
  fetchReport,
  fetchReports,
  type ClaimBody,
  type ReportFilters,
  type StatusChangeBody,
} from "./api";
import { DEMO_AREA_BBOX, DEMO_SERVICE_AREA } from "./config";
import { assigneeOf, sortQueue, type Assignee } from "./queue";
import type { Report, ReportInput, Status } from "./types";

export function useReports(filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", DEMO_AREA_BBOX, filters.status ?? null, filters.category ?? null],
    queryFn: ({ signal }) => fetchReports(DEMO_AREA_BBOX, filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: Infinity,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: ({ signal }) => fetchReport(id, signal),
  });
}

export function useCreateReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actorId }: { input: ReportInput; actorId: string }) =>
      createReport(input, actorId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["reports"] }),
  });
}

// ---------- S4 and S5 ----------

/**
 * Queue rows: GET /reports for the fixed demo area, one request per status filter (`undefined` = no filter),
 * merged and sorted on the client (the API has no queue endpoint). Sort order = priority, then age.
 */
export function useQueueReports(statuses: readonly (Status | undefined)[]) {
  return useQueries({
    queries: statuses.map((status) => ({
      queryKey: ["reports", "queue", DEMO_SERVICE_AREA.bbox, status ?? null],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchReports(DEMO_SERVICE_AREA.bbox, { status }, signal),
      placeholderData: keepPreviousData,
    })),
    combine: (results) => ({
      reports: sortQueue(results.flatMap((result) => result.data?.features.map((f) => f.properties) ?? [])),
      isPending: results.some((result) => result.isPending),
      error: results.find((result) => result.isError)?.error ?? null,
      refetch: () => results.forEach((result) => void result.refetch()),
    }),
  });
}

export type AssigneeState = { state: "loading" } | { state: "error" } | { state: "ready"; assignee: Assignee };

/** Assignee of every in_progress row, from the report detail (the list endpoint has no claim). Other rows are not requested. */
export function useAssignees(reports: readonly Report[]) {
  const ids = reports.filter((report) => report.status === "in_progress").map((report) => report.id);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["report", String(id)],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchReport(String(id), signal),
    })),
    combine: (results) => {
      const byId = new Map<number, AssigneeState>();
      results.forEach((result, index) => {
        byId.set(
          ids[index],
          result.data
            ? { state: "ready", assignee: assigneeOf(result.data) }
            : result.isError
              ? { state: "error" }
              : { state: "loading" },
        );
      });
      return byId;
    },
  });
}

export function useOrganisations() {
  return useQuery({
    queryKey: ["organisations"],
    queryFn: ({ signal }) => fetchOrganisations(signal),
    staleTime: Infinity,
  });
}

function refreshAfterAction(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["reports"] });
  void client.invalidateQueries({ queryKey: ["report"] });
}

export function useStatusChange() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, actorId }: { id: number; body: StatusChangeBody; actorId: string }) =>
      changeStatus(id, body, actorId),
    onSettled: () => refreshAfterAction(client),
  });
}

export function useClaim() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, actorId }: { id: number; body: ClaimBody; actorId: string }) =>
      claimReport(id, body, actorId),
    onSettled: () => refreshAfterAction(client),
  });
}
