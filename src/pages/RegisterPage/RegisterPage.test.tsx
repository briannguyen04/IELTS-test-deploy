import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { RegisterPage } from "./RegisterPage";
import { useAuth } from "../../contexts/AuthContext";

const { mockNavigate, mockRegister } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockRegister: vi.fn(),
}));

// Important: RegisterPage imports useNavigate from "react-router",
// not "react-router-dom"
vi.mock("react-router", () => ({
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

// RegisterPage imports this, even though NavBarGuest is not used
vi.mock("../../components/NavBar", () => ({
  NavBarGuest: () => <div data-testid="navbar-guest">Navbar Guest</div>,
}));

vi.mock("../../components/figma/ImageWithFallback", () => ({
  ImageWithFallback: () => <div data-testid="background-image" />,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRegister.mockReset();
    mockNavigate.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      register: mockRegister,
    } as any);
  });

  test("renders register form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: /register/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter your first name"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter your last name"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("your.email@example.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Create a password"),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Confirm your password"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /^register$/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /facebook/i }),
    ).toBeInTheDocument();
  });

  test("shows validation error when fields are empty", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Duy",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Huynh",
    );
    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "duy@gmail.com",
    );
    await user.type(screen.getByPlaceholderText("Create a password"), "123456");
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "654321",
    );

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("calls register and navigates to homepage when registration succeeds", async () => {
    const user = userEvent.setup();

    mockRegister.mockResolvedValue({
      success: true,
    });

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Duy",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Huynh",
    );
    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "duy@gmail.com",
    );
    await user.type(screen.getByPlaceholderText("Create a password"), "123456");
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "Duy",
        "Huynh",
        "duy@gmail.com",
        "123456",
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("shows cleaned server error from err.error", async () => {
    const user = userEvent.setup();

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockRegister.mockRejectedValue({
      error: "email: Email already exists",
    });

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Duy",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Huynh",
    );
    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "duy@gmail.com",
    );
    await user.type(screen.getByPlaceholderText("Create a password"), "123456");
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("shows cleaned field validation error from email field", async () => {
    const user = userEvent.setup();

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockRegister.mockRejectedValue({
      email: "email: Invalid email format",
    });

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Duy",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Huynh",
    );
    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "wrong-email",
    );
    await user.type(screen.getByPlaceholderText("Create a password"), "123456");
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("shows error message when register throws Error", async () => {
    const user = userEvent.setup();

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockRegister.mockRejectedValue(new Error("Network error"));

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Duy",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Huynh",
    );
    await user.type(
      screen.getByPlaceholderText("your.email@example.com"),
      "duy@gmail.com",
    );
    await user.type(screen.getByPlaceholderText("Create a password"), "123456");
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "123456",
    );

    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("navigates to login page", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
