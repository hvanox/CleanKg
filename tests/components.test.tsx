import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateReport } from "@/components/CreateReport";
import { ReportCard } from "@/components/ReportCard";
import { StatusChip } from "@/components/ui/Chips";
import { ky } from "@/i18n/ky";
import { ru } from "@/i18n/ru";
import { STATUSES } from "@/lib/types";
import { mockFetch, renderApp, sampleReport } from "./helpers";

vi.mock("@/components/map/PointPicker", () => ({ PointPicker: () => <div data-testid="picker" /> }));

const categories = {
  items: [
    { code: "illegal_dump", label_ru: "Стихийная свалка", label_ky: null, is_hazardous: false, volunteer_allowed: true, hidden_from_volunteers: false },
    { code: "trash_burning", label_ru: "Сжигание мусора", label_ky: null, is_hazardous: false, volunteer_allowed: false, hidden_from_volunteers: true },
  ],
};

describe("StatusChip", () => {
  it.each(["ru", "ky"] as const)("shows label and icon for every status (%s)", (locale) => {
    for (const status of STATUSES) {
      const { container, unmount } = renderApp(<StatusChip status={status} />, locale);
      const label = (locale === "ru" ? ru : ky).status[status];
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });
});

describe("S2 CreateReport", () => {
  it("has no file picker or gallery control and keeps submit disabled with the reason written", async () => {
    mockFetch({ "/api/v1/categories": categories });
    const { container } = renderApp(<CreateReport />);
    await screen.findByRole("combobox", { name: ru.create.categoryLabel });
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText(/галере|gallery/i)).toBeNull();
    const submit = screen.getByRole("button", { name: ru.create.submit });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/демо-фото, точку, категорию/)).toBeInTheDocument();
  });

  it("enables submit once photo, point and category exist, and sends X-Actor-Id", async () => {
    const calls = mockFetch({ "/api/v1/categories": categories });
    const user = userEvent.setup();
    renderApp(<CreateReport />);
    const category = await screen.findByRole("combobox", { name: ru.create.categoryLabel });
    await user.click(screen.getByRole("button", { name: ru.create.photoAdd }));
    await user.type(screen.getByLabelText(ru.create.lat), "42.8746");
    await user.type(screen.getByLabelText(ru.create.lng), "74.5698");
    await user.selectOptions(category, "trash_burning");
    expect(screen.getByRole("button", { name: ru.create.submit })).toBeEnabled();
    expect(screen.getByText(ru.create.notVolunteer)).toBeInTheDocument();
    expect(calls.some((url) => url.includes("/api/v1/categories"))).toBe(true);
  });

  it("shows an API error by its code", async () => {
    mockFetch({
      "/api/v1/categories": categories,
      "/api/v1/reports": { status: 422, body: { detail: { code: "location_outside_kyrgyzstan", message: "x" } } },
    });
    const user = userEvent.setup();
    renderApp(<CreateReport />);
    const category = await screen.findByRole("combobox", { name: ru.create.categoryLabel });
    await user.click(screen.getByRole("button", { name: ru.create.photoAdd }));
    await user.type(screen.getByLabelText(ru.create.lat), "10");
    await user.type(screen.getByLabelText(ru.create.lng), "10");
    await user.selectOptions(category, "illegal_dump");
    await user.click(screen.getByRole("button", { name: ru.create.submit }));
    expect(await screen.findByText(ru.errors.location_outside_kyrgyzstan)).toBeInTheDocument();
    expect(screen.getByText(/location_outside_kyrgyzstan/)).toBeInTheDocument();
  });
});

describe("S3 ReportCard", () => {
  it("shows no priority score, no subscribe, no volunteer action, and the honest organisation line", async () => {
    mockFetch({ "/api/v1/reports/7": sampleReport() });
    const { container } = renderApp(<ReportCard id="7" />);
    await screen.findByRole("heading", { level: 1, name: "Сжигание мусора" });
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/приоритет|priority|89/i);
    expect(text).not.toMatch(/подпис/i);
    expect(text).toContain("не подключена");
    expect(text).toContain(ru.card.notForVolunteers);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("textarea, input")).toBeNull();
    expect(text).not.toMatch(/\+?\d[\d\s()-]{8,}\d/);
    expect(text).not.toMatch(/@/);
  });

  it("prints the timeline in words with the date", async () => {
    mockFetch({ "/api/v1/reports/7": sampleReport() });
    const { container } = renderApp(<ReportCard id="7" />);
    await screen.findByText(ru.status.submitted, { selector: "span" });
    const lines = Array.from(container.querySelectorAll(".kg-timeline__line")).map((el) => el.textContent);
    expect(lines[0]).toContain("Отправлено · 19.10.2026, 14:20");
    expect(lines[1]).toContain("На проверке · 19.10.2026, 16:20");
  });

  it("shows the error code when the report does not exist", async () => {
    mockFetch({});
    renderApp(<ReportCard id="999" />);
    await waitFor(() => expect(screen.getByText(ru.errors.report_not_found)).toBeInTheDocument());
    expect(screen.getByText(/report_not_found/)).toBeInTheDocument();
  });
});
