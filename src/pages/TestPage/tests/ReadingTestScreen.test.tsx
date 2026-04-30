import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ReadingTestScreen } from "../components/ReadingTestScreen";
import { useAuth } from "../../../contexts/AuthContext.tsx";

const {
  mockNavigate,
  mockGetReadingExercise,
  mockPostUserSubmission,
  mockPostUserAnswersBulk,
  mockPostAttemptIncrement,
  mockLogActivity,
  mockGetQueuedActivities,
  mockOpenExitModal,
  mockConfirmExit,
  mockSetShowExitModal,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetReadingExercise: vi.fn(),
  mockPostUserSubmission: vi.fn(),
  mockPostUserAnswersBulk: vi.fn(),
  mockPostAttemptIncrement: vi.fn(),
  mockLogActivity: vi.fn(),
  mockGetQueuedActivities: vi.fn(),
  mockOpenExitModal: vi.fn(),
  mockConfirmExit: vi.fn(),
  mockSetShowExitModal: vi.fn(),
}));

// ReadingTestScreen imports useNavigate from react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../contexts/AuthContext.tsx", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../components/Logo.tsx", () => ({
  IELTSMastermindLogo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock("../components/InstructionRenderer.tsx", () => ({
  InstructionRenderer: ({ instruction, userAnswers }: any) => {
    if (userAnswers) {
      return (
        <div data-testid="question-renderer">
          {instruction?.title || "Mock Questions"}
        </div>
      );
    }

    return (
      <div data-testid="passage-renderer">
        {instruction?.title || "Mock Passage"}
      </div>
    );
  },
}));

vi.mock("../utils", () => ({
  formatTime: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  },
  buildAudioUrl: (base: string, audioUrl: string) => `${base}/${audioUrl}`,
}));

vi.mock("../hooks/index.ts", () => ({
  useGetReadingExercise: () => ({
    get: mockGetReadingExercise,
    exercise: {
      totalQuestions: 3,
      duration: 60,
      skill: "READING",
      passageParsed: {
        title: "Reading Passage 1",
      },
      examText: {
        title: "Reading Questions",
      },
    },
  }),

  useUserAnswer: () => ({
    answers: {
      1: ["A"],
      2: ["B"],
    },
    onAnswerChange: vi.fn(),
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

  usePostUserAnswersBulk: () => ({
    post: mockPostUserAnswersBulk,
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

describe("ReadingTestScreen", () => {
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

    mockPostUserAnswersBulk.mockResolvedValue({
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

  test("fetches reading exercise and logs test start when mounted", async () => {
    render(<ReadingTestScreen exerciseId="reading-123" />);

    await waitFor(() => {
      expect(mockGetReadingExercise).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledWith({
        activityType: "TEST_START",
      });
    });
  });

  test("renders timer, passage, questions, question buttons, and submit button", () => {
    render(<ReadingTestScreen exerciseId="reading-123" />);

    expect(screen.getByTestId("logo")).toBeInTheDocument();

    expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    expect(screen.getByText("58:20")).toBeInTheDocument();

    expect(screen.getByTestId("passage-renderer")).toBeInTheDocument();
    expect(screen.getByText("Reading Passage 1")).toBeInTheDocument();

    expect(screen.getByTestId("question-renderer")).toBeInTheDocument();
    expect(screen.getByText("Reading Questions")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^submit$/i }),
    ).toBeInTheDocument();
  });

  test("opens submit confirmation modal when Submit is clicked", async () => {
    const user = userEvent.setup();

    render(<ReadingTestScreen exerciseId="reading-123" />);

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

    render(<ReadingTestScreen exerciseId="reading-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Submit Test?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue test/i }));

    expect(screen.queryByText("Submit Test?")).not.toBeInTheDocument();
  });

  test("submits test, posts answers, increments attempt, and navigates to result page", async () => {
    const user = userEvent.setup();

    render(<ReadingTestScreen exerciseId="reading-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    const submitButtons = screen.getAllByRole("button", {
      name: /^submit$/i,
    });

    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockPostUserSubmission).toHaveBeenCalledWith({
        userId: "user-123",
        practiceContentId: "reading-123",
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

    expect(mockPostUserAnswersBulk).toHaveBeenCalledWith({
      userPracticeSubmissionId: "submission-123",
      answers: [
        {
          orderIndex: 1,
          answers: ["A"],
        },
        {
          orderIndex: 2,
          answers: ["B"],
        },
      ],
    });

    expect(mockPostAttemptIncrement).toHaveBeenCalled();

    expect(mockNavigate).toHaveBeenCalledWith("/test/result/submission-123");
  });

  test("clicking Exit test opens exit modal", async () => {
    const user = userEvent.setup();

    render(<ReadingTestScreen exerciseId="reading-123" />);

    await user.click(screen.getByRole("button", { name: /exit test/i }));

    expect(mockOpenExitModal).toHaveBeenCalled();
  });
});
