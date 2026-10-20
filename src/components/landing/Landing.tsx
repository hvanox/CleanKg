"use client";

import { CategoryRail } from "./CategoryRail";
import { Closing } from "./Closing";
import { Facts } from "./Facts";
import { Hero } from "./Hero";
import { Lifecycle } from "./Lifecycle";
import { ProductPanel } from "./ProductPanel";
import { Proof } from "./Proof";
import { Statement } from "./Statement";

/** Landing `/` (Persuade): the report as a product. Direction contract in .impeccable/surfaces/prototipe-web.md. */
export function Landing() {
  return (
    <div className="lp">
      <Hero />
      <Statement />
      <Lifecycle />
      <CategoryRail />
      <ProductPanel />
      <Proof />
      <Facts />
      <Closing />
    </div>
  );
}
