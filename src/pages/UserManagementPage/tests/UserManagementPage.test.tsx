import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { UserManagementPage } from "../UserManagementPage";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE } from "../../../env";

const { mockNavigate, mockLogout } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
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

vi.mock("../../../env", () => ({
  API_BASE: "${API_BASE}",
}));

vi.mock("../../../components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("../../../components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("../../../components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../../../components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div>
      <select
        aria-label="select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("../../TutorDashboardPage/components/SelectV2", () => ({
  SelectV2: ({ value, onChange, options, placeholder }: any) => (
    <select
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const mockUsersResponse = {
  success: true,
  data: [
    {
      userId: "user-1",
      firstname: "John",
      lastname: "Learner",
      email: "john@example.com",
      role: "Learner",
      isActive: true,
      createdAt: [2026, 1, 1, 10, 0, 0, 0],
      lastLoginAt: [2026, 1, 2, 10, 0, 0, 0],
    },
    {
      userId: "user-2",
      firstname: "Mary",
      lastname: "Tutor",
      email: "mary@example.com",
      role: "Tutor",
      isActive: false,
      createdAt: [2026, 1, 3, 10, 0, 0, 0],
      lastLoginAt: [2026, 1, 4, 10, 0, 0, 0],
    },
    {
      userId: "user-3",
      firstname: "Admin",
      lastname: "User",
      email: "admin@example.com",
      role: "Administrator",
      isActive: true,
      createdAt: [2026, 1, 5, 10, 0, 0, 0],
      lastLoginAt: [2026, 1, 6, 10, 0, 0, 0],
    },
  ],
};

describe("UserManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogout,
    } as any);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUsersResponse,
    }) as any;

    vi.stubGlobal("alert", vi.fn());
  });

  test("fetches and renders users, statistics, navbar, and footer", async () => {
    render(<UserManagementPage />);

    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getAllByTestId("footer").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(
      screen.getByText("Manage user accounts and permissions"),
    ).toBeInTheDocument();

    expect(screen.getByText("Mary Tutor")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("Learners")).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
  });

  test("filters users by search query", async () => {
    const user = userEvent.setup();

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Search by name or email..."),
      "mary",
    );

    expect(screen.getByText("Mary Tutor")).toBeInTheDocument();
    expect(screen.queryByText("John Learner")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
  });

  test("filters users by role and status", async () => {
    const user = userEvent.setup();

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText("Filter by role"), "Tutor");

    expect(screen.getByText("Mary Tutor")).toBeInTheDocument();
    expect(screen.queryByText("John Learner")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Filter by status"),
      "Inactive",
    );

    expect(screen.getByText("Mary Tutor")).toBeInTheDocument();
  });

  test("opens add user dialog and validates required fields", async () => {
    const user = userEvent.setup();

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add new user/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Add New User" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(
      screen.getByText("Please fill in all required fields."),
    ).toBeInTheDocument();
  });

  test("creates a new user", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUsersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUsersResponse,
      });

    globalThis.fetch = fetchMock as any;

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add new user/i }));

    await user.type(screen.getByPlaceholderText("John"), "New");
    await user.type(screen.getByPlaceholderText("Smith"), "User");
    await user.type(
      screen.getByPlaceholderText("john.smith@example.com"),
      "new@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter password"), "123456");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE}/api/user`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            firstname: "New",
            lastname: "User",
            email: "new@example.com",
            password: "123456",
            role: "Learner",
          }),
        }),
      );
    });
  });

  test("opens edit dialog and updates user", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUsersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            userId: "user-1",
            firstname: "Updated",
            lastname: "Learner",
            email: "updated@example.com",
            role: "Learner",
            isActive: true,
            createdAt: [2026, 1, 1, 10, 0, 0, 0],
            lastLoginAt: [2026, 1, 2, 10, 0, 0, 0],
          },
        }),
      });

    globalThis.fetch = fetchMock as any;

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    const editButtons = screen
      .getAllByRole("button")
      .filter((button) => button.innerHTML.includes("svg"));

    await user.click(editButtons[1]);

    expect(screen.getByText("Edit User")).toBeInTheDocument();

    const firstNameInput = screen.getByDisplayValue("John");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Updated");

    await user.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE}/api/user/user-1`,
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
  });

  test("deletes user", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUsersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

    globalThis.fetch = fetchMock as any;

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("John Learner")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    const deleteButton = buttons[2];

    await user.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE}/api/user/user-1`,
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });
  });

  test("handles unauthorized fetch by logging out and navigating home", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as any;

    render(<UserManagementPage />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
