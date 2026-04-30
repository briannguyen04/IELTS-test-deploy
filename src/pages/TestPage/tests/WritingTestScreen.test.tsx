import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { WritingTestScreen } from "../components/WritingTestScreen";
import { useAuth } from "../../../contexts/AuthContext.tsx";

const {
  mockNavigate,
  mockGetWritingExercise,
  mockPostUserSubmission,
  mockPostWritingAnswer,
  mockPostAIFeedback,
  mockPostAttemptIncrement,
  mockLogActivity,
  mockGetQueuedActivities,
  mockOnAnswerChange,
  mockOpenExitModal,
  mockConfirmExit,
  mockSetShowExitModal,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetWritingExercise: vi.fn(),
  mockPostUserSubmission: vi.fn(),
  mockPostWritingAnswer: vi.fn(),
  mockPostAIFeedback: vi.fn(),
  mockPostAttemptIncrement: vi.fn(),
  mockLogActivity: vi.fn(),
  mockGetQueuedActivities: vi.fn(),
  mockOnAnswerChange: vi.fn(),
  mockOpenExitModal: vi.fn(),
  mockConfirmExit: vi.fn(),
  mockSetShowExitModal: vi.fn(),
}));

// WritingTestScreen imports useNavigate from react-router
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../contexts/AuthContext.tsx", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../components/Logo.tsx", () => ({
  IELTSMastermindLogo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock("../components/InstructionRenderer.tsx", () => ({
  InstructionRenderer: ({ instruction }: any) => (
    <div data-testid="instruction-renderer">
      {instruction?.title || "Mock Writing Task"}
    </div>
  ),
}));

vi.mock("../utils", () => ({
  formatTime: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  },

  countWords: (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  },
}));

vi.mock("../hooks", () => ({
  useGetWritingExercise: () => ({
    get: mockGetWritingExercise,
    exercise: {
      duration: 60,
      examText: {
        title: "IELTS Writing Task 2",
      },
    },
  }),

  useUserAnswer: () => ({
    answers: {
      1: ["This is my essay answer"],
    },
    onAnswerChange: mockOnAnswerChange,
  }),

  useCountdownTimer: () => ({
    secondsRemaining: 3500,
    isExpired: false,
    getElapsedMs: vi.fn(() => 100000),
  }),

  useTestActivityLogger: () => ({
    logActivity: mockLogActivity,
    getQueuedActivities: mockGetQueuedActivities,
  }),

  usePostUserSubmission: () => ({
    post: mockPostUserSubmission,
  }),

  usePostUserPracticeWritingAnswer: () => ({
    post: mockPostWritingAnswer,
  }),

  usePostCreateWritingAIFeedback: () => ({
    post: mockPostAIFeedback,
  }),

  usePostUserPracticeContentProgressAttemptIncrement: () => ({
    post: mockPostAttemptIncrement,
  }),

  useExitModal: () => ({
    showExitModal: false,
    openExitModal: mockOpenExitModal,
    setShowExitModal: mockSetShowExitModal,
    confirmExit: mockConfirmExit,
  }),

  useSubmitModal: vi.fn(),
}));

describe("WritingTestScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-123",
      },
    } as any);

    mockPostUserSubmission.mockResolvedValue({
      practiceSubmissionId: "submission-123",
    });

    mockPostWritingAnswer.mockResolvedValue({
      success: true,
    });

    mockPostAIFeedback.mockResolvedValue({
      success: true,
    });

    mockPostAttemptIncrement.mockResolvedValue({
      success: true,
    });

    mockGetQueuedActivities.mockReturnValue([
      {
        activityType: "TEST_START",
      },
      {
        activityType: "TEST_SUBMIT",
      },
    ]);
  });

  test("fetches writing exercise and logs test start when mounted", async () => {
    render(<WritingTestScreen exerciseId="writing-123" />);

    await waitFor(() => {
      expect(mockGetWritingExercise).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledWith({
        activityType: "TEST_START",
      });
    });
  });

  test("renders timer, writing task, textarea, word count, and submit button", () => {
    render(<WritingTestScreen exerciseId="writing-123" />);

    expect(screen.getByTestId("logo")).toBeInTheDocument();

    expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    expect(screen.getByText("58:20")).toBeInTheDocument();

    expect(screen.getByTestId("instruction-renderer")).toBeInTheDocument();
    expect(screen.getByText("IELTS Writing Task 2")).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Type your essay here..."),
    ).toBeInTheDocument();

    expect(screen.getByText(/words count/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^submit$/i }),
    ).toBeInTheDocument();
  });

  test("calls onAnswerChange when user types in textarea", async () => {
    const user = userEvent.setup();

    render(<WritingTestScreen exerciseId="writing-123" />);

    await user.type(
      screen.getByPlaceholderText("Type your essay here..."),
      " more text",
    );

    expect(mockOnAnswerChange).toHaveBeenCalled();
  });

  test("opens submit confirmation modal when Submit is clicked", async () => {
    const user = userEvent.setup();

    render(<WritingTestScreen exerciseId="writing-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Submit Test?")).toBeInTheDocument();

    expect(
      screen.getByText(/are you sure you want to submit your test/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /continue test/i }),
    ).toBeInTheDocument();
  });

  test("closes submit confirmation modal when Continue Test is clicked", async () => {
    const user = userEvent.setup();

    render(<WritingTestScreen exerciseId="writing-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Submit Test?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue test/i }));

    expect(screen.queryByText("Submit Test?")).not.toBeInTheDocument();
  });

  test("submits writing answer, creates AI feedback, increments attempt, and navigates to result page", async () => {
    const user = userEvent.setup();

    render(<WritingTestScreen exerciseId="writing-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    const submitButtons = screen.getAllByRole("button", {
      name: /^submit$/i,
    });

    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockPostUserSubmission).toHaveBeenCalledWith({
        userId: "user-123",
        practiceContentId: "writing-123",
        timeSpentSeconds: 100,
        learnerTestActivities: [
          {
            activityType: "TEST_START",
          },
          {
            activityType: "TEST_SUBMIT",
          },
        ],
      });
    });

    expect(mockLogActivity).toHaveBeenCalledWith({
      activityType: "TEST_SUBMIT",
    });

    expect(mockPostWritingAnswer).toHaveBeenCalledWith({
      userPracticeSubmissionId: "submission-123",
      orderIndex: "1",
      essayText: "This is my essay answer",
    });

    expect(mockPostAIFeedback).toHaveBeenCalledWith({
      submissionId: "submission-123",
    });

    expect(mockPostAttemptIncrement).toHaveBeenCalled();

    expect(mockNavigate).toHaveBeenCalledWith("/test/result/submission-123");
  });

  test("clicking Exit test opens exit modal", async () => {
    const user = userEvent.setup();

    render(<WritingTestScreen exerciseId="writing-123" />);

    await user.click(screen.getByRole("button", { name: /exit test/i }));

    expect(mockOpenExitModal).toHaveBeenCalled();
  });
});
