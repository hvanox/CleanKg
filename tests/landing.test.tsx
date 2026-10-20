import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Landing } from "@/components/landing/Landing";
import { ru } from "@/i18n/ru";
import { renderApp } from "./helpers";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const DOCS = resolve(__dirname, "../../../Docs");
// prototipe/web is also a repository of its own (GitHub Pages workflow), where Docs/ is not checked out:
// the two tests that compare the landing with its source documents then skip, and run in the full project tree.
const hasDocs = existsSync(DOCS);
const doc = (file: string) => readFileSync(resolve(DOCS, file), "utf8");

describe("landing", () => {
  it("leads with the mechanism and one main action to the map", () => {
    renderApp(<Landing />);
    const hero = screen.getByRole("heading", { level: 1 });
    expect(hero).toHaveTextContent(ru.landing.hero.line1);
    const links = screen.getAllByRole("link", { name: new RegExp(ru.landing.ctaMap) });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/map");
  });

  it.skipIf(!hasDocs)("HR-1: every world number links to its source in Docs/05-pitch/facts.md", () => {
    const facts = doc("05-pitch/facts.md");
    renderApp(<Landing />);
    for (const item of ru.landing.facts.items) {
      expect(facts).toContain(item.url);
      const source = screen.getByRole("link", { name: new RegExp(item.source) });
      expect(source).toHaveAttribute("href", item.url);
    }
  });

  it.skipIf(!hasDocs)("HR-3: the SDG 11.6 quote is word for word the official text", () => {
    const sdg = doc("02-product/sdg-11.md");
    renderApp(<Landing />);
    expect(sdg).toContain(`«${ru.landing.sdg.quote}»`);
    expect(screen.getByText(`«${ru.landing.sdg.quote}»`)).toBeInTheDocument();
  });

  it("HR-5: hazardous waste and burning say volunteers never", () => {
    renderApp(<Landing />);
    for (const label of [ru.landing.rail.items.hazardous_waste.label, ru.landing.rail.items.trash_burning.label]) {
      const card = screen.getByRole("heading", { level: 3, name: label }).closest("li");
      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getByText(ru.landing.rail.volunteer.never)).toBeInTheDocument();
    }
  });

  it("HR-2 and HR-7: no partner logos, no phone numbers, demo cards are labelled", () => {
    const { container } = renderApp(<Landing />);
    expect(container.textContent).not.toMatch(/\+996|\b0\s?7\d{2}\b/);
    expect(container.querySelectorAll("img[alt*='logo' i]").length).toBe(0);
    const wheel = screen.getByRole("list", { name: ru.landing.hero.cardsLabel });
    expect(within(wheel).getAllByText(ru.demo.chip)).toHaveLength(ru.landing.hero.cards.length);
  });
});
