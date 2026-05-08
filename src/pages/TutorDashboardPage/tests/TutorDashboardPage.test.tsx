import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { TutorDashboardPage } from "../TutorDashboardPage";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useGetAllPracticeSubmissions,
  useGetAllTutorUserPracticeSubmissionsByTutorId,
} from "../hooks";

const {
  mockNavigate,
  mockGetAllPracticeSubmissions,
  mockGetAllTutorUserPracticeSubmissionsByTutorId,
  mockState,
  mockPracticeSubmissions,
  mockTutorUserPracticeSubmissions,
} = vi.hoisted(() => {
  const mockPracticeSubmissions = [
    {
      id: "submission-1",
      studentName: "John Learner",
      studentEmail: "john@example.com",
      skill: "Listening",
      task: "Part 1",
      title: "Listening Practice Review",
      submittedAt: "2026-01-01 10:00",
      timeTaken: "20 minutes",
      tutorStatus: "PENDING",
    },
    {
      id: "submission-2",
      studentName: "Mary Writer",
      studentEmail: "mary@example.com",
      skill: "Writing",
      task: "Task 2",
      title: "Writing Essay Review",
      submittedAt: "2026-01-02 11:00",
      timeTaken: "40 minutes",
      tutorStatus: "IN_REVIEW",
    },
    {
      id: "submission-3",
      studentName: "Peter Reader",
      studentEmail: "peter@example.com",
      skill: "Reading",
      task: "Passage 1",
      title: "Reading Passage Review",
      submittedAt: "2026-01-03 12:00",
      timeTaken: "35 minutes",
      tutorStatus: "COMPLETED",
    },
    {
      id: "submission-4",
      studentName: "Hidden Tutor Case",
      studentEmail: "hidden@example.com",
      skill: "Speaking",
      task: "Part 2",
      title: "Hidden Speaking Review",
      submittedAt: "2026-01-04 13:00",
      timeTaken: "15 minutes",
      tutorStatus: "IN_REVIEW",
    },
    {
      id: "submission-5",
      studentName: "Other Completed Case",
      studentEmail: "other@example.com",
      skill: "Listening",
      task: "Part 3",
      title: "Other Completed Review",
      submittedAt: "2026-01-05 14:00",
      timeTaken: "25 minutes",
      tutorStatus: "COMPLETED",
    },
  ];

  const mockTutorUserPracticeSubmissions = [
    {
      userPracticeSubmissionId: "submission-2",
      tutorStatus: "IN_REVIEW",
    },
    {
      userPracticeSubmissionId: "submission-3",
      tutorStatus: "COMPLETED",
    },
    {
      userPracticeSubmissionId: "submission-5",
      tutorStatus: "PENDING",
    },
  ];

  return {
    mockNavigate: vi.fn(),
    mockGetAllPracticeSubmissions: vi.fn(),
    mockGetAllTutorUserPracticeSubmissionsByTutorId: vi.fn(),
    mockPracticeSubmissions,
    mockTutorUserPracticeSubmissions,
    mockState: {
      practiceSubmissions: mockPracticeSubmissions,
      tutorUserPracticeSubmissions: mockTutorUserPracticeSubmissions,
    },
  };
});

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useGetAllPracticeSubmissions: vi.fn(),
  useGetAllTutorUserPracticeSubmissionsByTutorId: vi.fn(),
}));

vi.mock("../utils", () => ({
  getSkillColor: (skill: string) => `skill-${skill}`,
  getStatusColor: (status: string) => `status-${status}`,
  mapTutorStatus: (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pending",
      IN_REVIEW: "In Review",
      COMPLETED: "Completed",
    };

    return labels[status] ?? status;
  },
}));

vi.mock("../components", () => ({
  SelectV2: ({ value, onChange, options, placeholder }: any) => (
    <select
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../../components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type = "button", ...props }: any) => (
    <button type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/ui/badge", () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock("../../../components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("lucide-react", () => ({
  Clock: () => <span>Clock</span>,
  Search: () => <span>Search</span>,
  Eye: () => <span>Eye</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  BookOpen: () => <span>BookOpen</span>,
}));

const renderPage = () => render(<TutorDashboardPage />);

const mockTutorUser = (user: any = { id: "tutor-123" }) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
  } as any);
};

const resetMockState = () => {
  mockState.practiceSubmissions = mockPracticeSubmissions;
  mockState.tutorUserPracticeSubmissions = mockTutorUserPracticeSubmissions;
};

const expectStatisticValue = (label: string, value: string) => {
  const statisticLabel = screen
    .getAllByText(label)
    .find((element) => element.parentElement?.textContent?.includes(value));

  expect(statisticLabel).toBeTruthy();
};

describe("TutorDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    mockTutorUser();

    vi.mocked(useGetAllPracticeSubmissions).mockReturnValue({
      get: mockGetAllPracticeSubmissions,
      practiceSubmissions: mockState.practiceSubmissions,
    } as any);

    vi.mocked(useGetAllTutorUserPracticeSubmissionsByTutorId).mockReturnValue({
      get: mockGetAllTutorUserPracticeSubmissionsByTutorId,
      tutorUserPracticeSubmissions: mockState.tutorUserPracticeSubmissions,
    } as any);
  });

  describe("initial rendering and data loading", () => {
    test("renders dashboard layout, statistics, filters, and visible submissions", async () => {
      renderPage();

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();

      expect(screen.getByText("Review Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Review and manage student submissions"),
      ).toBeInTheDocument();

      expect(
        screen.getByPlaceholderText("Search by learner name or title"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Skill")).toBeInTheDocument();
      expect(screen.getByLabelText("Status")).toBeInTheDocument();

      expect(screen.getByText("John Learner")).toBeInTheDocument();
      expect(screen.getByText("Mary Writer")).toBeInTheDocument();
      expect(screen.getByText("Peter Reader")).toBeInTheDocument();

      expect(screen.queryByText("Hidden Tutor Case")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Other Completed Case"),
      ).not.toBeInTheDocument();

      expect(document.body).toHaveTextContent("Total");
      expect(document.body).toHaveTextContent("Pending");
      expect(document.body).toHaveTextContent("In Review");
      expect(document.body).toHaveTextContent("Completed");

      expectStatisticValue("Total", "3");
      expectStatisticValue("Pending", "1");
      expectStatisticValue("In Review", "1");
      expectStatisticValue("Completed", "1");

      await waitFor(() => {
        expect(mockGetAllPracticeSubmissions).toHaveBeenCalledWith({});
      });

      await waitFor(() => {
        expect(
          mockGetAllTutorUserPracticeSubmissionsByTutorId,
        ).toHaveBeenCalledWith({ tutorId: "tutor-123" });
      });
    });

    test("does not fetch tutor-specific submissions when tutor id is missing", async () => {
      mockTutorUser(null);

      renderPage();

      await waitFor(() => {
        expect(mockGetAllPracticeSubmissions).toHaveBeenCalledWith({});
      });

      expect(
        mockGetAllTutorUserPracticeSubmissionsByTutorId,
      ).not.toHaveBeenCalled();
    });
  });

  describe("visibility rules", () => {
    test("shows pending submissions to all tutors and only active assigned submissions when globally active", () => {
      renderPage();

      expect(screen.getByText("Listening Practice Review")).toBeInTheDocument();
      expect(screen.getByText("Writing Essay Review")).toBeInTheDocument();
      expect(screen.getByText("Reading Passage Review")).toBeInTheDocument();

      expect(
        screen.queryByText("Hidden Speaking Review"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Other Completed Review"),
      ).not.toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    test("filters submissions by learner name, title, and learner email", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.type(
        screen.getByPlaceholderText("Search by learner name or title"),
        "mary",
      );

      expect(screen.getByText("Mary Writer")).toBeInTheDocument();
      expect(screen.queryByText("John Learner")).not.toBeInTheDocument();
      expect(screen.queryByText("Peter Reader")).not.toBeInTheDocument();

      await user.clear(
        screen.getByPlaceholderText("Search by learner name or title"),
      );
      await user.type(
        screen.getByPlaceholderText("Search by learner name or title"),
        "Reading Passage",
      );

      expect(screen.getByText("Peter Reader")).toBeInTheDocument();
      expect(screen.queryByText("Mary Writer")).not.toBeInTheDocument();

      await user.clear(
        screen.getByPlaceholderText("Search by learner name or title"),
      );
      await user.type(
        screen.getByPlaceholderText("Search by learner name or title"),
        "john@example.com",
      );

      expect(screen.getByText("John Learner")).toBeInTheDocument();
      expect(screen.queryByText("Peter Reader")).not.toBeInTheDocument();
    });

    test("filters submissions by skill", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.selectOptions(screen.getByLabelText("Skill"), "Writing");

      expect(screen.getByText("Mary Writer")).toBeInTheDocument();
      expect(screen.getByText("Writing Essay Review")).toBeInTheDocument();
      expect(screen.queryByText("John Learner")).not.toBeInTheDocument();
      expect(screen.queryByText("Peter Reader")).not.toBeInTheDocument();
    });

    test("filters submissions by tutor status", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.selectOptions(screen.getByLabelText("Status"), "COMPLETED");

      expect(screen.getByText("Peter Reader")).toBeInTheDocument();
      expect(screen.getByText("Reading Passage Review")).toBeInTheDocument();
      expect(screen.queryByText("John Learner")).not.toBeInTheDocument();
      expect(screen.queryByText("Mary Writer")).not.toBeInTheDocument();
    });

    test("shows empty state when no submissions match filters", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.type(
        screen.getByPlaceholderText("Search by learner name or title"),
        "not-existing-submission",
      );

      expect(screen.getByText("No submissions found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters or search query"),
      ).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    test("navigates to result review page when Review button is clicked", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.click(screen.getAllByRole("button", { name: /review/i })[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/test/result/submission-1");
    });
  });

  describe("empty data", () => {
    test("renders empty state and zero counts when there are no visible submissions", () => {
      mockState.practiceSubmissions = [];
      mockState.tutorUserPracticeSubmissions = [];

      vi.mocked(useGetAllPracticeSubmissions).mockReturnValue({
        get: mockGetAllPracticeSubmissions,
        practiceSubmissions: mockState.practiceSubmissions,
      } as any);

      vi.mocked(useGetAllTutorUserPracticeSubmissionsByTutorId).mockReturnValue(
        {
          get: mockGetAllTutorUserPracticeSubmissionsByTutorId,
          tutorUserPracticeSubmissions: mockState.tutorUserPracticeSubmissions,
        } as any,
      );

      renderPage();

      expect(screen.getByText("No submissions found")).toBeInTheDocument();
      expectStatisticValue("Total", "0");
      expectStatisticValue("Pending", "0");
      expectStatisticValue("In Review", "0");
      expectStatisticValue("Completed", "0");
    });
  });
});
