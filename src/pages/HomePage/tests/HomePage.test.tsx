import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HomePage } from "../HomePage";

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../../components/figma/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: any) => (
    <div data-testid="image-with-fallback">{alt}</div>
  ),
}));

vi.mock("figma:asset/5c2f46fbe8110f6b9ff43987b477d1270d3ffeef.png", () => ({
  default: "feature-real-format.png",
}));

vi.mock("figma:asset/1eff21458494ef41c65462b2789f5a6082f161c8.png", () => ({
  default: "feature-ai-scoring.png",
}));

vi.mock("figma:asset/577d4868435baa881d5b64f45db557c1042d04e9.png", () => ({
  default: "reading.png",
}));

vi.mock("figma:asset/bcdd3bfc80e3d2ce8f4a19178b607cb85cb9a8ee.png", () => ({
  default: "speaking.png",
}));

vi.mock("figma:asset/e9c4ff12ea38c2a89800b6f3c2055fa2156f37fc.png", () => ({
  default: "listening.png",
}));

vi.mock("figma:asset/79f59bf5912d98c84c9d2e2055387a0bd9773a30.png", () => ({
  default: "writing.png",
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders homepage sections", () => {
    render(<HomePage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getAllByTestId("footer").length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText("WE TAKE YOUR").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByText("IELTS SCORE HIGHER").length,
    ).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Practice Exercises")).toBeInTheDocument();
    expect(screen.getByText("Active Students")).toBeInTheDocument();
    expect(screen.getByText("Skills Covered")).toBeInTheDocument();
    expect(screen.getByText("Instant Feedback")).toBeInTheDocument();

    expect(screen.getByText("Choose Your Path to Success")).toBeInTheDocument();
    expect(screen.getByText("Why IELTS Mastermind?")).toBeInTheDocument();
    expect(
      screen.getByText("Ready to Start Your IELTS Journey?"),
    ).toBeInTheDocument();
  });

  test("renders all IELTS skill cards", () => {
    render(<HomePage />);

    expect(screen.getByText("Listening")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText("Speaking")).toBeInTheDocument();
  });

  test("clicking hero start practicing navigates to listening page", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    const heroButtons = screen.getAllByRole("button", {
      name: /^start practicing$/i,
    });

    await user.click(heroButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/listening");
  });

  test("clicking bottom CTA navigates to listening page", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.click(
      screen.getByRole("button", { name: /start practicing now/i }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/listening");
  });

  test("clicking skill cards navigates to correct skill pages", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.click(screen.getByText("Listening"));
    expect(mockNavigate).toHaveBeenCalledWith("/listening");

    await user.click(screen.getByText("Reading"));
    expect(mockNavigate).toHaveBeenCalledWith("/reading");

    await user.click(screen.getByText("Writing"));
    expect(mockNavigate).toHaveBeenCalledWith("/writing");

    await user.click(screen.getByText("Speaking"));
    expect(mockNavigate).toHaveBeenCalledWith("/speaking");
  });

  test("carousel next and previous buttons change visible slide", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    expect(screen.getByText("IELTS SCORE HIGHER")).toBeInTheDocument();

    const carouselButtons = screen.getAllByRole("button");

    await user.click(carouselButtons[1]);
    expect(screen.getByText("IELTS SKILLS")).toBeInTheDocument();

    await user.click(carouselButtons[0]);
    expect(screen.getByText("IELTS SCORE HIGHER")).toBeInTheDocument();
  });

  test("clicking slide indicator changes slide", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    const buttons = screen.getAllByRole("button");

    const indicatorButtons = buttons.slice(2, 5);

    await user.click(indicatorButtons[2]);

    expect(screen.getByText("AI-POWERED FEEDBACK")).toBeInTheDocument();
  });
});
