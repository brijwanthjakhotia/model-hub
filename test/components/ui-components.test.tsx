// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RatingStars } from "@/components/ui/rating-stars";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Pagination } from "@/components/ui/pagination";

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

  it("is decorative (aria-hidden) with no label", () => {
    const { container } = render(<RatingStars value={4} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes a labelled img role when a label is given", () => {
    render(<RatingStars value={4} label="Rated 4 out of 5" />);
    const el = screen.getByRole("img", { name: "Rated 4 out of 5" });
    expect(el).not.toHaveAttribute("aria-hidden");
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

describe("SubmitButton", () => {
  // Outside a <form action>, useFormStatus reports pending:false, so it renders
  // children (not pendingText) — enough to verify prop forwarding + defaults.
  it("is a type=submit button rendering its children by default", () => {
    render(<SubmitButton pendingText="Saving…">Save changes</SubmitButton>);
    const btn = screen.getByRole("button", { name: "Save changes" });
    expect(btn).toHaveAttribute("type", "submit");
    expect(btn).not.toBeDisabled();
  });

  it("forwards variant/size/className to the underlying Button", () => {
    render(
      <SubmitButton variant="danger" size="sm" className="w-full">
        Delete
      </SubmitButton>,
    );
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn.className).toContain("bg-danger");
    expect(btn.className).toContain("w-full");
  });

  it("honors an explicit disabled prop", () => {
    render(<SubmitButton disabled>Go</SubmitButton>);
    expect(screen.getByRole("button", { name: "Go" })).toBeDisabled();
  });
});

describe("Pagination", () => {
  it("renders nothing when there's a single page", () => {
    const { container } = render(
      <Pagination basePath="/models" page={1} pageSize={12} total={10} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders numbered pages with a current marker across multiple pages", () => {
    render(<Pagination basePath="/models" page={2} pageSize={12} total={40} />); // 4 pages
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toBeInTheDocument();
    // current page carries aria-current
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    // page-3 link points at ?page=3
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/models?page=3");
  });

  it("preserves other params and omits page=1 in hrefs", () => {
    render(
      <Pagination
        basePath="/models"
        page={2}
        pageSize={12}
        total={40}
        params={{ category: "Runway" }}
      />,
    );
    // page 1 link keeps the filter but drops ?page
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/models?category=Runway");
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute(
      "href",
      "/models?category=Runway&page=3",
    );
  });
});
