import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("renders StellarFlow branding and navigation tabs", () => {
    const onTabChange = vi.fn();
    const onOpenCreate = vi.fn();
    render(
      <Navbar
        currentTab="dashboard"
        onTabChange={onTabChange}
        onOpenCreate={onOpenCreate}
        wallet={{
          installed: true,
          address: null,
          status: "disconnected",
          error: null,
          connect: vi.fn(),
          disconnect: vi.fn(),
        }}
        theme="dark"
        onToggleTheme={vi.fn()}
      />
    );
    expect(screen.getByText("StellarFlow")).toBeDefined();
    expect(screen.getByText("+ New Stream")).toBeDefined();
    fireEvent.click(screen.getByText("+ New Stream"));
    expect(onOpenCreate).toHaveBeenCalledTimes(1);

    const senderTab = screen.getByText("Sender");
    fireEvent.click(senderTab);
    expect(onTabChange).toHaveBeenCalledWith("sender");
  });
});

