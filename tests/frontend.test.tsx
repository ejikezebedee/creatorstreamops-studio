// @vitest-environment jsdom

import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { Login } from "../src/main.js";

describe("frontend auth gate", () => {
  it("smoke renders the local admin login gate", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    flushSync(() => {
      createRoot(container).render(<Login onLogin={() => undefined} />);
    });
    expect(document.body.textContent).toContain("CreatorStreamOps Studio");
  });
});
