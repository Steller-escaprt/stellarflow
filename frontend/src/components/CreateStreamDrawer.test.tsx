import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateStreamDrawer } from "./CreateStreamDrawer";

describe("CreateStreamDrawer", () => {
  it("renders when open and handles close action", () => {
    const onClose = vi.fn();
    render(
      <CreateStreamDrawer
        isOpen={true}
        onClose={onClose}
        onCreate={vi.fn()}
      />
    );
    expect(screen.getByText("Create Payment Stream")).toBeDefined();
    const closeBtn = screen.getByLabelText("Close drawer");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render contents when closed", () => {
    render(
      <CreateStreamDrawer
        isOpen={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />
    );
    expect(screen.queryByText("Create Payment Stream")).toBeNull();
  });
});

