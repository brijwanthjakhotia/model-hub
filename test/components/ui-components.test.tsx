// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RatingStars } from "@/components/ui/rating-stars";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

afterEach(cleanup);

/** The inner overlay spans carry an inline `width` that encodes the fill. */
function fillWidths(container: HTMLElement) {
  return Array.from(container.querySelectorAll("span"))
    .filter((s) => s.style.width !== "")
    .map((s) => s.style.width);
}

describe("RatingStars", () => {
  it("renders exactly five stars", () => {
    const { container } = render(<RatingStars value={0} />);
    expect(fillWidths(container)).toHaveLength(5);
  });

  it("fully fills whole-number ratings", () => {
    const { container } = render(<RatingStars value={4} />);
    expect(fillWidths(container)).toEqual(["100%", "100%", "100%", "100%", "0%"]);
  });

  it("supports fractional fill", () => {
    const { container } = render(<RatingStars value={3.5} />);
    expect(fillWidths(container)).toEqual(["100%", "100%", "100%", "50%", "0%"]);
  });

  it("clamps values above five", () => {
    const { container } = render(<RatingStars value={9} />);
    expect(fillWidths(container)).toEqual(["100%", "100%", "100%", "100%", "100%"]);
  });
});

describe("StatusBadge", () => {
  it("renders the correct label for each status", () => {
    const { rerender } = render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pending review")).toBeInTheDocument();

    rerender(<StatusBadge status="APPROVED" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();

    rerender(<StatusBadge status="REJECTED" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Featured</Badge>);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("applies tone-specific classes", () => {
    render(<Badge tone="success">Live</Badge>);
    expect(screen.getByText("Live").className).toContain("text-success");
  });
});
