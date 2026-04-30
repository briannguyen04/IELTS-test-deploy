import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ListeningReadingResultScreen } from "../components/ListeningReadingResultScreen";
import { useAuth } from "../../../contexts/AuthContext.tsx";

const {
  mockState,
  mockGetPracticeSubmission,
  mockGetPracticeContent,
  mockGetPracticeContentAnswers,
  mockGetPracticeSubmissionAnswers,
  mockGetUserData,
} = vi.hoisted(() => ({
  mockState: {
    submission: {
      practiceSubmissionId: "submission-123",
      practiceContentId: "content-123",
      userId: "user-123",
      timeSpentSeconds: 125,
      correctAnswerCount: 2,
      wrongAnswerCount: 1,
      skipAnswerCount: 1,
      submittedAt: "2026-01-01T10:00:00",
    },
    practiceContent: {
      title: "Mock Listening Test",
      skill: "LISTENING",
    },
    correctAnswers: [
      {
        orderIndex: 1,
        correctAnswers: ["A"],
      },
      {
        orderIndex: 2,
        correctAnswers: ["B"],
      },
      {
        orderIndex: 3,
        correctAnswers: ["C"],
      },
      {
        orderIndex: 4,
        correctAnswers: ["D"],
      },
    ],
    submissionAnswers: [
      {
        orderIndex: 1,
        answers: ["A"],
        result: "CORRECT",
      },
      {
        orderIndex: 2,
        answers: ["X"],
        result: "WRONG",
      },
      {
        orderIndex: 3,
        answers: [],
        result: "SKIPPED",
      },
      {
        orderIndex: 4,
        answers: ["D"],
        result: "CORRECT",
      },
    ],
    userData: {
      firstname: "Duy",
      lastname: "Huynh",
    },
  },

  mockGetPracticeSubmission: vi.fn(),
  mockGetPracticeContent: vi.fn(),
  mockGetPracticeContentAnswers: vi.fn(),
  mockGetPracticeSubmissionAnswers: vi.fn(),
  mockGetUserData: vi.fn(),
}));

vi.mock("../../../contexts/AuthContext.tsx", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../../components/NavBarUnified.tsx", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/ui/badge.tsx", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="badge">{children}</div>
  ),
}));

vi.mock("../components/index.ts", () => ({
  FeedbackSection: ({ submissionId }: { submissionId: string }) => (
    <div data-testid="feedback-section">Feedback Section - {submissionId}</div>
  ),

  ReviewListening: ({ exerciseId }: { exerciseId?: string }) => (
    <div data-testid="review-listening">Review Listening - {exerciseId}</div>
  ),

  ReviewReading: ({ exerciseId }: { exerciseId?: string }) => (
    <div data-testid="review-reading">Review Reading - {exerciseId}</div>
  ),

  TutorStatusButtons: ({
    submissionId,
    onTutorStatusChange,
  }: {
    submissionId: string;
    onTutorStatusChange: (status: string) => void;
  }) => (
    <div data-testid="tutor-status-buttons">
      Tutor Status Buttons - {submissionId}
      <button onClick={() => onTutorStatusChange("APPROVED")}>
        Mark Reviewed
      </button>
      <button onClick={() => onTutorStatusChange("PENDING")}>
        Mark Pending
      </button>
    </div>
  ),
}));

vi.mock("../utils", () => ({
  formatTime: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  },

  indexByOrderIndex: (answers: any[]) => {
    return answers.reduce(
      (acc, answer) => {
        acc[answer.orderIndex] = answer;
        return acc;
      },
      {} as Record<number, any>,
    );
  },

  mapPracticeSkill: (skill?: string) => {
    if (skill === "LISTENING") return "Listening";
    if (skill === "READING") return "Reading";
    return "";
  },

  formatLocalDateTime: () => "01/01/2026 10:00",
}));

vi.mock("../hooks", () => ({
  useGetPracticeSubmission: () => ({
    get: mockGetPracticeSubmission,
    submission: mockState.submission,
  }),

  useGetPracticeContent: () => ({
    get: mockGetPracticeContent,
    practiceContent: mockState.practiceContent,
  }),

  useGetPracticeContentAnswers: () => ({
    get: mockGetPracticeContentAnswers,
    answers: mockState.correctAnswers,
  }),

  useGetPracticeSubmissionAnswers: () => ({
    get: mockGetPracticeSubmissionAnswers,
    answers: mockState.submissionAnswers,
  }),

  useGetUserData: () => ({
    get: mockGetUserData,
    userData: mockState.userData,
  }),
}));

describe("ListeningReadingResultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockState.submission = {
      practiceSubmissionId: "submission-123",
      practiceContentId: "content-123",
      userId: "user-123",
      timeSpentSeconds: 125,
      correctAnswerCount: 2,
      wrongAnswerCount: 1,
      skipAnswerCount: 1,
      submittedAt: "2026-01-01T10:00:00",
    };

    mockState.practiceContent = {
      title: "Mock Listening Test",
      skill: "LISTENING",
    };

    mockState.correctAnswers = [
      {
        orderIndex: 1,
        correctAnswers: ["A"],
      },
      {
        orderIndex: 2,
        correctAnswers: ["B"],
      },
      {
        orderIndex: 3,
        correctAnswers: ["C"],
      },
      {
        orderIndex: 4,
        correctAnswers: ["D"],
      },
    ];

    mockState.submissionAnswers = [
      {
        orderIndex: 1,
        answers: ["A"],
        result: "CORRECT",
      },
      {
        orderIndex: 2,
        answers: ["X"],
        result: "WRONG",
      },
      {
        orderIndex: 3,
        answers: [],
        result: "SKIPPED",
      },
      {
        orderIndex: 4,
        answers: ["D"],
        result: "CORRECT",
      },
    ];

    mockState.userData = {
      firstname: "Duy",
      lastname: "Huynh",
    };

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-123",
        role: "student",
      },
    } as any);
  });

  test("fetches submission, content, answers, and user data when mounted", async () => {
    render(<ListeningReadingResultScreen submissionId="submission-123" />);

    await waitFor(() => {
      expect(mockGetPracticeSubmission).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetPracticeContent).toHaveBeenCalled();
      expect(mockGetPracticeContentAnswers).toHaveBeenCalled();
      expect(mockGetPracticeSubmissionAnswers).toHaveBeenCalled();
      expect(mockGetUserData).toHaveBeenCalled();
    });
  });

  test("renders listening result summary, answer keys, review section, and feedback section", () => {
    render(<ListeningReadingResultScreen submissionId="submission-123" />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    expect(screen.getByText("Mock Listening Test")).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();

    expect(screen.getByText("Duy Huynh")).toBeInTheDocument();
    expect(screen.getByText("Listening")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026 10:00")).toBeInTheDocument();

    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    expect(screen.getByText("Time Spent")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();

    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();

    expect(screen.getByText("Wrong")).toBeInTheDocument();
    expect(screen.getAllByText("1 questions").length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText("Skip")).toBeInTheDocument();

    expect(screen.getByText("Answer Keys")).toBeInTheDocument();
    expect(screen.getByText("(empty)")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    expect(screen.getByTestId("review-listening")).toHaveTextContent(
      "Review Listening - content-123",
    );

    expect(screen.queryByTestId("review-reading")).not.toBeInTheDocument();

    expect(screen.getByTestId("feedback-section")).toHaveTextContent(
      "Feedback Section - submission-123",
    );
  });

  test("renders reading review section when practice content skill is READING", () => {
    mockState.practiceContent = {
      title: "Mock Reading Test",
      skill: "READING",
    };

    render(<ListeningReadingResultScreen submissionId="submission-123" />);

    expect(screen.getByText("Mock Reading Test")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();

    expect(screen.getByTestId("review-reading")).toHaveTextContent(
      "Review Reading - content-123",
    );

    expect(screen.queryByTestId("review-listening")).not.toBeInTheDocument();
  });

  test("shows tutor status buttons for tutor and hides feedback while status is pending or not selected", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "tutor-123",
        role: "tutor",
      },
    } as any);

    render(<ListeningReadingResultScreen submissionId="submission-123" />);

    expect(screen.getByTestId("tutor-status-buttons")).toBeInTheDocument();

    expect(screen.queryByTestId("feedback-section")).not.toBeInTheDocument();
  });

  test("shows feedback section for tutor after tutor status changes to approved", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "tutor-123",
        role: "tutor",
      },
    } as any);

    render(<ListeningReadingResultScreen submissionId="submission-123" />);

    expect(screen.queryByTestId("feedback-section")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mark reviewed/i }));

    await waitFor(() => {
      expect(screen.getByTestId("feedback-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("feedback-section")).toHaveTextContent(
      "Feedback Section - submission-123",
    );
  });
});
