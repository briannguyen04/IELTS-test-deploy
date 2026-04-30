import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ListeningTestScreen } from "../components/ListeningTestScreen";
import { useAuth } from "../../../contexts/AuthContext.tsx";

const {
  mockNavigate,
  mockGetListeningExercise,
  mockPostUserSubmission,
  mockPostUserAnswersBulk,
  mockPostAttemptIncrement,
  mockLogActivity,
  mockGetQueuedActivities,
  mockTogglePlay,
  mockHandleSeek,
  mockOpenExitModal,
  mockConfirmExit,
  mockSetShowExitModal,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetListeningExercise: vi.fn(),
  mockPostUserSubmission: vi.fn(),
  mockPostUserAnswersBulk: vi.fn(),
  mockPostAttemptIncrement: vi.fn(),
  mockLogActivity: vi.fn(),
  mockGetQueuedActivities: vi.fn(),
  mockTogglePlay: vi.fn(),
  mockHandleSeek: vi.fn(),
  mockOpenExitModal: vi.fn(),
  mockConfirmExit: vi.fn(),
  mockSetShowExitModal: vi.fn(),
}));

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
  InstructionRenderer: () => (
    <div data-testid="instruction-renderer">Mock Questions</div>
  ),
}));

vi.mock("../../../env.ts", () => ({
  API_BASE: "http://localhost:8080",
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
  useGetListeningExercise: () => ({
    get: mockGetListeningExercise,
    exercise: {
      totalQuestions: 3,
      duration: 40,
      audioUrl: "listening-audio.mp3",
      examText: {
        title: "Listening Test",
      },
      skill: "LISTENING",
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
    secondsRemaining: 2300,
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

  useAudioPlayer: () => ({
    audioRef: { current: null },
    isPlaying: false,
    currentTime: 0,
    duration: 120,
    audioProgress: 25,
    togglePlay: mockTogglePlay,
    handleSeek: mockHandleSeek,
    handleLoadedMetadata: vi.fn(),
    handleTimeUpdate: vi.fn(),
    handleEnded: vi.fn(),
  }),

  useExitModal: () => ({
    showExitModal: false,
    openExitModal: mockOpenExitModal,
    setShowExitModal: mockSetShowExitModal,
    confirmExit: mockConfirmExit,
  }),

  useSubmitModal: vi.fn(),
}));

describe("ListeningTestScreen", () => {
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

  test("fetches listening exercise and logs test start when mounted", async () => {
    render(<ListeningTestScreen exerciseId="exercise-123" />);

    await waitFor(() => {
      expect(mockGetListeningExercise).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledWith({
        activityType: "TEST_START",
      });
    });
  });

  test("renders timer, audio area, questions, question buttons, and submit button", () => {
    render(<ListeningTestScreen exerciseId="exercise-123" />);

    expect(screen.getByTestId("logo")).toBeInTheDocument();

    expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    expect(screen.getByText("38:20")).toBeInTheDocument();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    expect(screen.getByTestId("instruction-renderer")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^submit$/i }),
    ).toBeInTheDocument();
  });

  test("opens submit confirmation modal when Submit is clicked", async () => {
    const user = userEvent.setup();

    render(<ListeningTestScreen exerciseId="exercise-123" />);

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

    render(<ListeningTestScreen exerciseId="exercise-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Submit Test?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue test/i }));

    expect(screen.queryByText("Submit Test?")).not.toBeInTheDocument();
  });

  test("submits test, posts answers, increments attempt, and navigates to result page", async () => {
    const user = userEvent.setup();

    render(<ListeningTestScreen exerciseId="exercise-123" />);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    const submitButtons = screen.getAllByRole("button", {
      name: /^submit$/i,
    });

    await user.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockPostUserSubmission).toHaveBeenCalledWith({
        userId: "user-123",
        practiceContentId: "exercise-123",
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

    render(<ListeningTestScreen exerciseId="exercise-123" />);

    await user.click(screen.getByRole("button", { name: /exit test/i }));

    expect(mockOpenExitModal).toHaveBeenCalled();
  });
});
