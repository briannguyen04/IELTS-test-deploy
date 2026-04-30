import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { WritingResultScreen } from "../components/WritingResultScreen";
import { useAuth } from "../../../contexts/AuthContext.tsx";

const {
  mockState,
  mockGetPracticeSubmission,
  mockGetPracticeContent,
  mockGetWritingAnswer,
  mockGetUserData,
} = vi.hoisted(() => ({
  mockState: {
    submission: {
      practiceSubmissionId: "submission-123",
      practiceContentId: "content-123",
      userId: "user-123",
      timeSpentSeconds: 125,
      submittedAt: "2026-01-01T10:00:00",
    },
    practiceContent: {
      id: "content-123",
      title: "IELTS Writing Result Test",
      skill: "WRITING",
      task: "TASK_2",
      instructionsParsed: {
        title: "Discuss both views and give your opinion.",
      },
    },
    writingAnswers: [
      {
        id: "writing-answer-123",
        essayText: "This is my submitted essay answer.",
        wordCount: 6,
      },
    ],
    userData: {
      firstname: "Duy",
      lastname: "Huynh",
    },
  },

  mockGetPracticeSubmission: vi.fn(),
  mockGetPracticeContent: vi.fn(),
  mockGetWritingAnswer: vi.fn(),
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

vi.mock("../../../components/ui/badge", () => ({
  Badge: ({ children }: any) => <div data-testid="badge">{children}</div>,
}));

vi.mock("../components/InstructionRendererSimplified.tsx", () => ({
  InstructionRendererSimplified: ({ instruction }: any) => (
    <div data-testid="instruction-renderer">
      {instruction?.title || "Mock Instructions"}
    </div>
  ),
}));

vi.mock("../components/FeedbackSection.tsx", () => ({
  FeedbackSection: ({ submissionId }: { submissionId: string }) => (
    <div data-testid="feedback-section">Feedback Section - {submissionId}</div>
  ),
}));

vi.mock("../components/index.ts", () => ({
  TutorStatusButtons: ({
    submissionId,
    learnerId,
    skill,
    canCompleteReview,
    onTutorStatusChange,
  }: any) => (
    <div data-testid="tutor-status-buttons">
      Tutor Status Buttons - {submissionId} - {learnerId} - {skill} -
      canCompleteReview: {String(canCompleteReview)}
      <button onClick={() => onTutorStatusChange("PENDING")}>
        Mark Pending
      </button>
      <button onClick={() => onTutorStatusChange("IN_REVIEW")}>
        Mark In Review
      </button>
      <button onClick={() => onTutorStatusChange("APPROVED")}>
        Mark Approved
      </button>
    </div>
  ),

  WritingOverallScore: ({
    writingSubmissionId,
    taskType,
    onScoreExistChange,
  }: any) => (
    <div data-testid="writing-overall-score">
      Writing Overall Score - {writingSubmissionId} - {taskType}
      <button onClick={() => onScoreExistChange(true)}>Set Score Exists</button>
    </div>
  ),

  WritingFeedbackAnalysis: ({
    submissionId,
    writingSubmissionId,
    taskType,
    canEdit,
  }: any) => (
    <div data-testid="writing-feedback-analysis">
      Writing Feedback Analysis - {submissionId} - {writingSubmissionId} -{" "}
      {taskType} - canEdit: {String(canEdit)}
    </div>
  ),
}));

vi.mock("../utils/index.ts", () => ({
  formatLocalDateTime: () => "01/01/2026 10:00",

  formatTaskLabel: (task?: string) => {
    if (task === "TASK_1") return "Task 1";
    if (task === "TASK_2") return "Task 2";
    return "";
  },

  formatTimeVerbose: (seconds: number) => {
    if (seconds === 125) return "2 minutes 5 seconds";
    return `${seconds} seconds`;
  },

  mapPracticeSkill: (skill?: string) => {
    if (skill === "WRITING") return "Writing";
    return "";
  },
}));

vi.mock("../hooks/index.ts", () => ({
  useGetPracticeSubmission: () => ({
    get: mockGetPracticeSubmission,
    submission: mockState.submission,
  }),

  useGetPracticeContent: () => ({
    get: mockGetPracticeContent,
    practiceContent: mockState.practiceContent,
  }),

  useGetWritingAnswer: () => ({
    get: mockGetWritingAnswer,
    writingAnswers: mockState.writingAnswers,
  }),

  useGetUserData: () => ({
    get: mockGetUserData,
    userData: mockState.userData,
  }),
}));

describe("WritingResultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockState.submission = {
      practiceSubmissionId: "submission-123",
      practiceContentId: "content-123",
      userId: "user-123",
      timeSpentSeconds: 125,
      submittedAt: "2026-01-01T10:00:00",
    };

    mockState.practiceContent = {
      id: "content-123",
      title: "IELTS Writing Result Test",
      skill: "WRITING",
      task: "TASK_2",
      instructionsParsed: {
        title: "Discuss both views and give your opinion.",
      },
    };

    mockState.writingAnswers = [
      {
        id: "writing-answer-123",
        essayText: "This is my submitted essay answer.",
        wordCount: 6,
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

  test("fetches submission, content, writing answer, and user data when mounted", async () => {
    render(<WritingResultScreen submissionId="submission-123" />);

    await waitFor(() => {
      expect(mockGetPracticeSubmission).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetPracticeContent).toHaveBeenCalled();
      expect(mockGetWritingAnswer).toHaveBeenCalled();
      expect(mockGetUserData).toHaveBeenCalled();
    });
  });

  test("renders writing result details for student", () => {
    render(<WritingResultScreen submissionId="submission-123" />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    expect(screen.getByText("IELTS Writing Result Test")).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();

    expect(screen.getByText("Duy Huynh")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026 10:00")).toBeInTheDocument();

    expect(screen.getByText("Time Taken")).toBeInTheDocument();
    expect(screen.getByText("2 minutes 5 seconds")).toBeInTheDocument();

    expect(screen.getByText("Word Count")).toBeInTheDocument();
    expect(screen.getByText("6 words")).toBeInTheDocument();

    expect(screen.getByText("Task Type")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();

    expect(screen.getByText("Task Instructions")).toBeInTheDocument();
    expect(screen.getByTestId("instruction-renderer")).toHaveTextContent(
      "Discuss both views and give your opinion.",
    );

    expect(screen.getByText("Your Answer")).toBeInTheDocument();
    expect(
      screen.getByText("This is my submitted essay answer."),
    ).toBeInTheDocument();

    expect(screen.getByTestId("writing-overall-score")).toHaveTextContent(
      "Writing Overall Score - writing-answer-123 - TASK_2",
    );

    expect(screen.getByTestId("writing-feedback-analysis")).toHaveTextContent(
      "Writing Feedback Analysis - submission-123 - writing-answer-123 - TASK_2 - canEdit: false",
    );

    expect(screen.getByTestId("feedback-section")).toHaveTextContent(
      "Feedback Section - submission-123",
    );
  });

  test("renders no answer message when essay text is empty", () => {
    mockState.writingAnswers = [
      {
        id: "writing-answer-123",
        essayText: "",
        wordCount: 0,
      },
    ];

    render(<WritingResultScreen submissionId="submission-123" />);

    expect(screen.getByText("No answer provided")).toBeInTheDocument();
    expect(screen.getByText("0 words")).toBeInTheDocument();
  });

  test("shows tutor status buttons and hides reviewed content when tutor status is not selected", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "tutor-123",
        role: "tutor",
      },
    } as any);

    render(<WritingResultScreen submissionId="submission-123" />);

    expect(screen.getByTestId("tutor-status-buttons")).toBeInTheDocument();
    expect(screen.getByTestId("tutor-status-buttons")).toHaveTextContent(
      "Tutor Status Buttons - submission-123 - user-123 - WRITING",
    );

    expect(
      screen.queryByTestId("writing-overall-score"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("writing-feedback-analysis"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("feedback-section")).not.toBeInTheDocument();
  });

  test("shows tutor reviewed content as editable when tutor status is IN_REVIEW", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "tutor-123",
        role: "tutor",
      },
    } as any);

    render(<WritingResultScreen submissionId="submission-123" />);

    await user.click(screen.getByRole("button", { name: /mark in review/i }));

    await waitFor(() => {
      expect(screen.getByTestId("writing-overall-score")).toBeInTheDocument();
    });

    expect(screen.getByTestId("writing-feedback-analysis")).toHaveTextContent(
      "canEdit: true",
    );

    expect(screen.getByTestId("feedback-section")).toBeInTheDocument();
  });

  test("updates tutor complete review availability when writing score exists", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "tutor-123",
        role: "tutor",
      },
    } as any);

    render(<WritingResultScreen submissionId="submission-123" />);

    expect(screen.getByTestId("tutor-status-buttons")).toHaveTextContent(
      "canCompleteReview: false",
    );

    await user.click(screen.getByRole("button", { name: /mark in review/i }));

    await user.click(screen.getByRole("button", { name: /set score exists/i }));

    await waitFor(() => {
      expect(screen.getByTestId("tutor-status-buttons")).toHaveTextContent(
        "canCompleteReview: true",
      );
    });
  });
});
