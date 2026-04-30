import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { TestPage } from "../TestPage";

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock("react-router", () => ({
  useParams: () => mockUseParams(),
}));

// Because this test file is inside src/pages/TestPage/tests,
// the correct path is ../components/index.ts
vi.mock("../components/index.ts", () => ({
  ListeningTestScreen: ({ exerciseId }: { exerciseId: string }) => (
    <div data-testid="listening-test-screen">
      Listening Test Screen - {exerciseId}
    </div>
  ),

  ReadingTestScreen: ({ exerciseId }: { exerciseId: string }) => (
    <div data-testid="reading-test-screen">
      Reading Test Screen - {exerciseId}
    </div>
  ),

  WritingTestScreen: ({ exerciseId }: { exerciseId: string }) => (
    <div data-testid="writing-test-screen">
      Writing Test Screen - {exerciseId}
    </div>
  ),
}));

describe("TestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders ListeningTestScreen when skill is listening", () => {
    mockUseParams.mockReturnValue({
      skill: "listening",
      exerciseId: "listening-123",
    });

    render(<TestPage />);

    expect(screen.getByTestId("listening-test-screen")).toBeInTheDocument();
    expect(screen.getByText(/listening-123/i)).toBeInTheDocument();
  });

  test("renders ReadingTestScreen when skill is reading", () => {
    mockUseParams.mockReturnValue({
      skill: "reading",
      exerciseId: "reading-123",
    });

    render(<TestPage />);

    expect(screen.getByTestId("reading-test-screen")).toBeInTheDocument();
    expect(screen.getByText(/reading-123/i)).toBeInTheDocument();
  });

  test("renders WritingTestScreen when skill is writing", () => {
    mockUseParams.mockReturnValue({
      skill: "writing",
      exerciseId: "writing-123",
    });

    render(<TestPage />);

    expect(screen.getByTestId("writing-test-screen")).toBeInTheDocument();
    expect(screen.getByText(/writing-123/i)).toBeInTheDocument();
  });

  test("passes empty exerciseId when exerciseId is missing", () => {
    mockUseParams.mockReturnValue({
      skill: "listening",
      exerciseId: undefined,
    });

    render(<TestPage />);

    expect(screen.getByTestId("listening-test-screen")).toBeInTheDocument();
    expect(screen.getByText(/Listening Test Screen -/i)).toBeInTheDocument();
  });
});
