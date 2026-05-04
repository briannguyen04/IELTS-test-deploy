import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { useAuth } from "../../contexts/AuthContext";

const { mockNavigate, mockLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../components/figma/ImageWithFallback", () => ({
  ImageWithFallback: () => <div data-testid="background-image" />,
}));

vi.mock("../../env", () => ({
  API_BASE: "${API_BASE}",
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLogin.mockReset();
    mockNavigate.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
    } as any);
  });

  test("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("your.email@example.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^login$/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /facebook/i }),
    ).toBeInTheDocument();
  });

  test("shows validation error when email and password are empty", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(
      screen.getByText("Please enter email and password."),
    ).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("calls login and navigates administrator to content management page", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      role: "administrator",
    });

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "admin@gmail.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@gmail.com", "123456");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/content-management");
    });
  });

  test("calls login and navigates tutor to tutor dashboard", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      role: "tutor",
    });

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "tutor@gmail.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("tutor@gmail.com", "123456");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/tutor/dashboard");
    });
  });

  test("calls login and navigates normal user to homepage", async () => {
    const user = userEvent.setup();

    mockLogin.mockResolvedValue({
      role: "student",
    });

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "student@gmail.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("student@gmail.com", "123456");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows error message when login fails", async () => {
    const user = userEvent.setup();

    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "wrong@gmail.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "wrongpassword",
    );

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("navigates to forgot password page", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });

  test("navigates to register page", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
