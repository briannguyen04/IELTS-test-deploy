import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { BrowsePage } from "../BrowsePage";
import { useAuth } from "../../../contexts/AuthContext";

const {
  mockNavigate,
  mockUseParams,
  mockGetExercises,
  mockGetProgresses,
  mockSetSearchQuery,
  mockSetSelectedTask,
  mockSetSelectedQuestionType,
  mockSetSelectedTopic,
  mockSetSortBy,
  mockSetPage,
  mockResetPage,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseParams: vi.fn(),
  mockGetExercises: vi.fn(),
  mockGetProgresses: vi.fn(),
  mockSetSearchQuery: vi.fn(),
  mockSetSelectedTask: vi.fn(),
  mockSetSelectedQuestionType: vi.fn(),
  mockSetSelectedTopic: vi.fn(),
  mockSetSortBy: vi.fn(),
  mockSetPage: vi.fn(),
  mockResetPage: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
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

vi.mock("../components", () => ({
  ExerciseCard: ({ exercise, isBookmarked, onSelect }: any) => (
    <button data-testid="exercise-card" onClick={onSelect}>
      {exercise.title} - bookmarked: {String(isBookmarked)}
    </button>
  ),

  ExerciseModal: ({
    exerciseMetadata,
    pageType,
    attempCount,
    onClose,
  }: any) => (
    <div data-testid="exercise-modal">
      <p>Modal: {exerciseMetadata.title}</p>
      <p>Page Type: {pageType}</p>
      <p>Attempts: {attempCount}</p>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

const mockExercises = [
  {
    id: "exercise-1",
    title: "Listening Practice 1",
    skill: "LISTENING",
    task: "1",
    questionTypes: ["Multiple Choice"],
    topicTags: ["Education"],
  },
  {
    id: "exercise-2",
    title: "Listening Practice 2",
    skill: "LISTENING",
    task: "2",
    questionTypes: ["Matching"],
    topicTags: ["Science"],
  },
];

vi.mock("../hooks", () => ({
  useGetPracticeContent: () => ({
    exercises: mockExercises,
    get: mockGetExercises,
  }),

  useFilterExercisesBySkill: ({ exercises }: any) => ({
    skillExercises: exercises ?? mockExercises,
  }),

  useFilterExercisesByStatus: (exercisesOrProps: any) => ({
    filteredExercises:
      exercisesOrProps?.exercises ?? exercisesOrProps ?? mockExercises,
  }),

  useFilterExercisesBySearch: ({ exercises }: any) => ({
    state: {
      searchQuery: "",
    },
    setters: {
      setSearchQuery: mockSetSearchQuery,
    },
    derived: {
      filteredExercises: exercises ?? [],
    },
  }),

  useFilterExercisesByTask: ({ exercises }: any) => ({
    state: {
      selectedTask: "all",
    },
    setters: {
      setSelectedTask: mockSetSelectedTask,
    },
    derived: {
      filteredExercises: exercises ?? [],
      availableTasks: ["1", "2"],
    },
  }),

  useFilterExercisesByQuestionType: ({ exercises }: any) => ({
    state: {
      selectedQuestionType: "all",
    },
    setters: {
      setSelectedQuestionType: mockSetSelectedQuestionType,
    },
    derived: {
      filteredExercises: exercises ?? [],
      availableQuestionTypes: ["Multiple Choice", "Matching"],
    },
  }),

  useFilterExercisesByTopic: ({ exercises }: any) => ({
    state: {
      selectedTopic: "all",
    },
    setters: {
      setSelectedTopic: mockSetSelectedTopic,
    },
    derived: {
      filteredExercises: exercises ?? [],
      availableTopics: ["Education", "Science"],
    },
  }),

  useExerciseSort: ({ exercises }: any) => ({
    state: {
      sortBy: "newest",
    },
    setters: {
      setSortBy: mockSetSortBy,
    },
    derived: {
      sortedExercises: exercises ?? [],
    },
  }),

  useExercisePagination: ({ exercises }: any) => ({
    state: {
      page: 1,
    },
    setters: {
      setPage: mockSetPage,
    },
    derived: {
      currentExercises: exercises ?? [],
      totalPages: 2,
    },
    actions: {
      resetPage: mockResetPage,
    },
  }),

  useGetUserPracticeContentProgresses: () => ({
    get: mockGetProgresses,
    progresses: [
      {
        practiceContentId: "exercise-1",
        isBookmarked: true,
        attemptCount: 3,
      },
    ],
  }),
}));

vi.mock("../utils", () => ({
  mapUserPracticeContentProgressesByPracticeContentId: (progresses: any[]) =>
    (progresses ?? []).reduce((acc, progress) => {
      acc[progress.practiceContentId] = progress;
      return acc;
    }, {}),
}));

describe("BrowsePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({
      skill: "listening",
    });

    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      logout: vi.fn(),
      user: {
        id: "user-123",
      },
    } as any);
  });

  test("renders browse page, filters, exercise cards, pagination, navbar, and footer", async () => {
    render(<BrowsePage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getAllByTestId("footer").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByPlaceholderText("Search by name")).toBeInTheDocument();

    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Question type")).toBeInTheDocument();
    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(screen.getByText("Sort By")).toBeInTheDocument();

    expect(
      screen.getByText("Listening Practice 1 - bookmarked: true"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Listening Practice 2 - bookmarked: false"),
    ).toBeInTheDocument();

    expect(screen.getByText("Showing 1-2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetExercises).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetProgresses).toHaveBeenCalled();
    });
  });

  test("redirects to home when skill route param is invalid", () => {
    mockUseParams.mockReturnValue({
      skill: "invalid-skill",
    });

    render(<BrowsePage />);

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  test("updates search query and resets pagination", async () => {
    const user = userEvent.setup();

    render(<BrowsePage />);

    await user.type(screen.getByPlaceholderText("Search by name"), "listening");

    expect(mockSetSearchQuery).toHaveBeenCalled();
    expect(mockResetPage).toHaveBeenCalled();
  });

  test("clicking task, question type, and topic filters calls handlers", async () => {
    const user = userEvent.setup();

    render(<BrowsePage />);

    await user.click(screen.getByRole("button", { name: "Task 1" }));
    expect(mockSetSelectedTask).toHaveBeenCalledWith("1");
    expect(mockResetPage).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));
    expect(mockSetSelectedQuestionType).toHaveBeenCalledWith("Multiple Choice");

    await user.click(screen.getByRole("button", { name: "Education" }));
    expect(mockSetSelectedTopic).toHaveBeenCalledWith("Education");
  });

  test("clicking sort options calls setSortBy and resets pagination", async () => {
    const user = userEvent.setup();

    render(<BrowsePage />);

    await user.click(screen.getByLabelText("Oldest"));
    expect(mockSetSortBy).toHaveBeenCalledWith("oldest");

    await user.click(screen.getByLabelText("Most attempts"));
    expect(mockSetSortBy).toHaveBeenCalledWith("attempts");

    await user.click(screen.getByLabelText("A → Z"));
    expect(mockSetSortBy).toHaveBeenCalledWith("a-z");

    await user.click(screen.getByLabelText("Z → A"));
    expect(mockSetSortBy).toHaveBeenCalledWith("z-a");
  });

  test("opens and closes exercise modal", async () => {
    const user = userEvent.setup();

    render(<BrowsePage />);

    await user.click(
      screen.getByText("Listening Practice 1 - bookmarked: true"),
    );

    expect(screen.getByTestId("exercise-modal")).toBeInTheDocument();
    expect(screen.getByText("Modal: Listening Practice 1")).toBeInTheDocument();
    expect(screen.getByText("Page Type: listening")).toBeInTheDocument();
    expect(screen.getByText("Attempts: 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close modal/i }));

    expect(screen.queryByTestId("exercise-modal")).not.toBeInTheDocument();
  });

  test("pagination buttons call setPage", async () => {
    const user = userEvent.setup();

    render(<BrowsePage />);

    const buttons = screen.getAllByRole("button");

    const previousButton = buttons[buttons.length - 2];
    const nextButton = buttons[buttons.length - 1];

    await user.click(previousButton);
    await user.click(nextButton);

    expect(mockSetPage).toHaveBeenCalled();
  });
});
