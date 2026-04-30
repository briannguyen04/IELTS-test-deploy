import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import StudyPlanPage from "../StudyPlanPage";
import { useAuth } from "../../../contexts/AuthContext";

const {
  mockSubmissionCountGet,
  mockHasActiveStudyPlanGet,
  mockActiveStudyPlanGet,
  mockPostStudyPlan,
  mockFinalizeStudyPlan,
  mockState,
} = vi.hoisted(() => ({
  mockSubmissionCountGet: vi.fn(),
  mockHasActiveStudyPlanGet: vi.fn(),
  mockActiveStudyPlanGet: vi.fn(),
  mockPostStudyPlan: vi.fn(),
  mockFinalizeStudyPlan: vi.fn(),

  mockState: {
    submissionCountBySkill: {
      listeningCount: 3,
      readingCount: 6,
      writingCount: 0,
      speakingCount: 0,
    },
    hasActiveStudyPlan: false,
    activeStudyPlan: null as any,
  },
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../hooks", () => ({
  useGetSubmissionCountBySkillByUserId: () => ({
    get: mockSubmissionCountGet,
    submissionCountBySkill: mockState.submissionCountBySkill,
  }),

  useGetHasActiveStudyPlan: () => ({
    get: mockHasActiveStudyPlanGet,
  }),

  useGetActiveStudyPlanByUserIdAndSkill: () => ({
    get: mockActiveStudyPlanGet,
  }),

  usePostLearnerStudyPlan: () => ({
    post: mockPostStudyPlan,
  }),

  usePutFinalizeLearnerStudyPlanById: () => ({
    put: mockFinalizeStudyPlan,
  }),
}));

vi.mock("../types", () => ({
  mapSkillTypeApiTypeToUi: (skill: string) => {
    const map: Record<string, string> = {
      LISTENING: "Listening",
      READING: "Reading",
      WRITING: "Writing",
      SPEAKING: "Speaking",
    };
    return map[skill] ?? skill;
  },

  mapDirectionApiTypeToUi: (direction: string) => direction,
  mapFocusTypeApiTypeToUi: (focusType: string) => focusType,
  mapStrengthStatusApiTypeToUi: (status: string) => status,
  mapTargetMetricApiTypeToUi: (metric: string) => metric,
  mapTaskStatusApiTypeToUi: (status: string) => status,
  mapWeaknessStatusApiTypeToUi: (status: string) => status,
}));

vi.mock("../utils", () => ({
  getDirectionIcon: () => <span data-testid="direction-icon">Icon</span>,
  getStrengthStatusColor: () => "strength-status-color",
  getTaskStatusColor: () => "task-status-color",
  getWeaknessStatusColor: () => "weakness-status-color",
}));

vi.mock("../../ListeningContentEditorPage/types", () => ({
  mapTopicTagApiToUi: (topicTag: string) => topicTag,
}));

vi.mock("../../MyProfilePage/types", () => ({
  mapQuestionApiTypeToUi: (_skill: string, questionType: string) =>
    questionType,
}));

const activeStudyPlanMock = {
  id: "study-plan-123",
  submissionCountSinceCreation: 5,
  readyToFinalize: true,
  tasks: [
    {
      status: "COMPLETED",
      focusType: "QUESTION_TYPE",
      questionType: "MULTIPLE_CHOICE",
      topicTag: null,
      targetMetric: "ACCURACY",
      currentValue: 60,
      targetValue: 80,
      direction: "INCREASE",
      description: "Practice multiple choice questions.",
    },
    {
      status: "PENDING",
      focusType: "TOPIC_TAG",
      questionType: null,
      topicTag: "EDUCATION",
      targetMetric: "ACCURACY",
      currentValue: 40,
      targetValue: 70,
      direction: "INCREASE",
      description: "Improve education topic performance.",
    },
  ],
  strengthBlocks: [
    {
      status: "ACTIVE",
      focusType: "QUESTION_TYPE",
      questionType: "MATCHING",
      topicTag: null,
      description: "Strong matching performance.",
      explanation: "You often answer matching questions correctly.",
      evidence: "Recent submissions show high accuracy.",
      recommendedNextAction: "Maintain this skill.",
    },
  ],
  weaknessBlocks: [
    {
      status: "ACTIVE",
      focusType: "TOPIC_TAG",
      questionType: null,
      topicTag: "SCIENCE",
      description: "Science topic needs improvement.",
      explanation: "You miss science-related questions often.",
      evidence: "Recent submissions show low accuracy.",
      recommendedNextAction: "Practice science passages.",
    },
  ],
};

describe("StudyPlanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-123",
      },
    } as any);

    mockState.submissionCountBySkill = {
      listeningCount: 3,
      readingCount: 6,
      writingCount: 0,
      speakingCount: 0,
    };

    mockState.hasActiveStudyPlan = false;
    mockState.activeStudyPlan = null;

    mockSubmissionCountGet.mockResolvedValue(undefined);

    mockHasActiveStudyPlanGet.mockImplementation(async () => ({
      hasActiveStudyPlan: mockState.hasActiveStudyPlan,
    }));

    mockActiveStudyPlanGet.mockImplementation(
      async () => mockState.activeStudyPlan,
    );

    mockPostStudyPlan.mockResolvedValue({
      success: true,
    });

    mockFinalizeStudyPlan.mockResolvedValue({
      success: true,
    });
  });

  test("renders page header, skill buttons, navbar, and footer", async () => {
    render(<StudyPlanPage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("My Study Plan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Personalized learning path based on your performance analysis",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Listening" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reading" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Writing" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Speaking" }),
    ).toBeInTheDocument();

    expect(screen.getAllByTestId("footer").length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(mockSubmissionCountGet).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });
  });

  test("shows requirement banner when selected skill does not have enough submissions", async () => {
    render(<StudyPlanPage />);

    expect(
      screen.getByText(/Complete More Listening Submissions/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/3\/5/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /enable study plan/i }),
    ).toBeDisabled();
  });

  test("shows ready banner when selected skill has enough submissions", async () => {
    const user = userEvent.setup();

    render(<StudyPlanPage />);

    await user.click(screen.getByRole("button", { name: "Reading" }));

    expect(
      screen.getByText(/Ready to Enable Your Reading Study Plan/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/Requirements met/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /enable study plan/i }),
    ).not.toBeDisabled();
  });

  test("enables study plan and renders active plan sections", async () => {
    const user = userEvent.setup();

    mockState.hasActiveStudyPlan = false;
    mockState.activeStudyPlan = activeStudyPlanMock;

    mockHasActiveStudyPlanGet
      .mockResolvedValueOnce({ hasActiveStudyPlan: false })
      .mockResolvedValueOnce({ hasActiveStudyPlan: false })
      .mockResolvedValueOnce({ hasActiveStudyPlan: true });

    render(<StudyPlanPage />);

    await user.click(screen.getByRole("button", { name: "Reading" }));

    await user.click(
      screen.getByRole("button", { name: /enable study plan/i }),
    );

    await waitFor(() => {
      expect(mockPostStudyPlan).toHaveBeenCalledWith({
        learnerId: "user-123",
        skill: "READING",
      });
    });

    await waitFor(() => {
      expect(mockActiveStudyPlanGet).toHaveBeenCalledWith({
        userId: "user-123",
        skill: "READING",
      });
    });

    expect(screen.getByText("Finalize Study Plan")).toBeInTheDocument();
    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(
      screen.getByText("Practice multiple choice questions."),
    ).toBeInTheDocument();

    expect(screen.getByText("Strength Blocks")).toBeInTheDocument();
    expect(
      screen.getByText("Strong matching performance."),
    ).toBeInTheDocument();

    expect(screen.getByText("Weakness Blocks")).toBeInTheDocument();
    expect(
      screen.getByText("Science topic needs improvement."),
    ).toBeInTheDocument();
  });

  test("loads and renders active study plan when backend says plan already exists", async () => {
    mockState.hasActiveStudyPlan = true;
    mockState.activeStudyPlan = activeStudyPlanMock;

    mockHasActiveStudyPlanGet.mockResolvedValue({
      hasActiveStudyPlan: true,
    });

    mockActiveStudyPlanGet.mockResolvedValue(activeStudyPlanMock);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(mockActiveStudyPlanGet).toHaveBeenCalledWith({
        userId: "user-123",
        skill: "LISTENING",
      });
    });

    expect(screen.getByText("Finalize Study Plan")).toBeInTheDocument();
    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.getByText("Strength Blocks")).toBeInTheDocument();
    expect(screen.getByText("Weakness Blocks")).toBeInTheDocument();
  });

  test("finalizes active study plan", async () => {
    const user = userEvent.setup();

    mockState.hasActiveStudyPlan = true;
    mockState.activeStudyPlan = activeStudyPlanMock;

    mockHasActiveStudyPlanGet
      .mockResolvedValueOnce({ hasActiveStudyPlan: true })
      .mockResolvedValueOnce({ hasActiveStudyPlan: false });

    mockActiveStudyPlanGet.mockResolvedValue(activeStudyPlanMock);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /finalize study plan/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /finalize study plan/i }),
    );

    await waitFor(() => {
      expect(mockFinalizeStudyPlan).toHaveBeenCalledWith({
        studyPlanId: "study-plan-123",
      });
    });
  });
});
