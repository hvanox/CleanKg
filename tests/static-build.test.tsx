import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Banner } from "@/components/Banner";
import { ProductPanel } from "@/components/landing/ProductPanel";
import { ReportRoute } from "@/components/ReportRoute";
import { ReportCell } from "@/components/queue/ReportCell";
import { ru } from "@/i18n/ru";
import { demoRequest, resetDemoState } from "@/lib/demo-api";
import { ky } from "@/i18n/ky";
import { renderApp, sampleReport } from "./helpers";

let search = "";
vi.mock("next/navigation", () => ({
  usePathname: () => "/map/",
  useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
  search = "";
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function browserMode(basePath = "") {
  vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "browser");
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", basePath);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("fetch must not be called in browser mode"))),
  );
}

describe("«Сбросить демо-данные»", () => {
  it("is not shown in the default build", () => {
    renderApp(<Banner />);
    expect(screen.queryByRole("button", { name: ru.banner.reset })).toBeNull();
  });

  it("is shown in browser mode, in ru and in ky, and restores the seed", async () => {
    browserMode();
    resetDemoState();
    await demoRequest("/api/v1/reports", {
      method: "POST",
      actorId: "1",
      body: JSON.stringify({ category: "illegal_dump", size: "small", lat: 42.87, lng: 74.57, description: "демо: тест", anonymous: false }),
    });
    expect(await demoRequest("/api/v1/reports/16")).toMatchObject({ id: 16 });

    renderApp(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: ru.banner.reset }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(ru.banner.resetDone));
    await expect(demoRequest("/api/v1/reports/16")).rejects.toMatchObject({ status: 404, code: "report_not_found" });
    expect(await demoRequest("/api/v1/reports/1")).toMatchObject({ id: 1 });
  });

  it("has a Kyrgyz label", () => {
    browserMode();
    renderApp(<Banner />, "ky");
    expect(screen.getByRole("button", { name: ky.banner.reset })).toBeInTheDocument();
  });
});

describe("/r?id= report card route", () => {
  it("reads the id from the query string and shows a seeded report from the in-browser API", async () => {
    browserMode();
    resetDemoState();
    search = "id=1";
    renderApp(<ReportRoute />);
    expect(await screen.findByRole("heading", { level: 1, name: "Стихийная свалка" })).toBeInTheDocument();
    expect(screen.getByText(/демо: свалка у арыка на ул\. Токтогула/)).toBeInTheDocument();
  });

  it("shows a report created in the browser (id 16 and up), with «Житель» for an anonymous author", async () => {
    browserMode();
    resetDemoState();
    const created = (await demoRequest("/api/v1/reports", {
      method: "POST",
      actorId: "1",
      body: JSON.stringify({ category: "littered_area", size: "small", lat: 42.87, lng: 74.57, description: "демо: новая", anonymous: true }),
    })) as { id: number };
    search = `id=${created.id}`;
    renderApp(<ReportRoute />);
    expect(await screen.findByRole("heading", { level: 1, name: /Замусоренная территория/ })).toBeInTheDocument();
    expect(screen.getAllByText("Житель").length).toBeGreaterThan(0);
    expect(screen.queryByText("Айгуль")).toBeNull();
  });

  it("says the report was not found for an unknown id and for a missing id", async () => {
    browserMode();
    resetDemoState();
    search = "id=999";
    const first = renderApp(<ReportRoute />);
    expect(await screen.findByText(/report_not_found/)).toBeInTheDocument();
    first.unmount();
    search = "";
    renderApp(<ReportRoute />);
    expect(screen.getByText(/report_not_found/)).toBeInTheDocument();
  });
});

describe("links and public paths", () => {
  it("queue rows link to /r?id=", () => {
    renderApp(
      <table>
        <tbody>
          <tr>
            <td>
              <ReportCell report={sampleReport({ id: 7 })} />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByRole("link", { name: /Сжигание мусора, / })).toHaveAttribute("href", "/r?id=7");
  });

  it("the landing product panel opens the card as /r?id=1 and prefixes its screenshots with the base path", async () => {
    browserMode("/CleanKg");
    const { container } = renderApp(<ProductPanel />);
    await userEvent.click(screen.getByRole("tab", { name: ru.landing.product.tabs.card.label }));
    expect(screen.getByRole("link", { name: ru.landing.product.open })).toHaveAttribute("href", "/r?id=1");
    const sources = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(sources.length).toBe(4);
    for (const src of sources) expect(src).toMatch(/^\/CleanKg\/landing\/screen-[a-z]+\.webp$/);
    const sets = [...container.querySelectorAll("source")].map((source) => source.getAttribute("srcset"));
    for (const set of sets) expect(set).toMatch(/^\/CleanKg\/landing\/screen-[a-z]+-m\.webp$/);
  });

  it("leaves the screenshots without a prefix in the default build", () => {
    const { container } = renderApp(<ProductPanel />);
    for (const img of container.querySelectorAll("img")) expect(img.getAttribute("src")).toMatch(/^\/landing\//);
  });
});
