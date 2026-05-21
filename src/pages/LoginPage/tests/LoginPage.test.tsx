import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LoginPage } from "../LoginPage";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE } from "../../../env";

const { mockNavigate, mockLogin } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/figma/ImageWithFallback", () => ({
  ImageWithFallback: () => <div data-testid="background-image" />,
}));

const renderPage = () => render(<LoginPage />);

const emailInput = () => screen.getByPlaceholderText("your.email@example.com");
const passwordInput = () => screen.getByPlaceholderText("Enter your password");
const loginButton = () => screen.getByRole("button", { name: /^login$/i });

const fillLoginForm = async (
  user: ReturnType<typeof userEvent.setup>,
  email = "student@gmail.com",
  password = "123456",
) => {
  if (email !== "") await user.type(emailInput(), email);
  if (password !== "") await user.type(passwordInput(), password);
};

const mockSuccessfulRedirectDelay = () => {
  const originalSetTimeout = globalThis.setTimeout;

  return vi
    .spyOn(globalThis, "setTimeout")
    .mockImplementation((callback, delay, ...args) => {
      if (delay === 2000 && typeof callback === "function") {
        callback(...args);
        return 0 as any;
      }

      return originalSetTimeout(callback as any, delay as any, ...args);
    });
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
    } as any);
  });

  describe("rendering", () => {
    test("renders login page layout and main actions", () => {
      renderPage();

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByTestId("background-image")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: /login/i }),
      ).toBeInTheDocument();

      expect(emailInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(loginButton()).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /facebook/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /forgot password/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /^register$/i }),
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    test.each([
      ["empty email and password", "", "", "Email and password are required"],
      ["empty email", "", "123456", "Email is required"],
      ["empty password", "student@gmail.com", "", "Password is required"],
      [
        "invalid email format",
        "invalid-email",
        "123456",
        "Email format is invalid",
      ],
    ])(
      "shows validation error when %s",
      async (_, email, password, expectedMessage) => {
        const user = userEvent.setup();

        renderPage();
        await fillLoginForm(user, email, password);
        await user.click(loginButton());

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );
  });

  describe("password visibility", () => {
    test("toggles password input type", async () => {
      const user = userEvent.setup();

      renderPage();

      const input = passwordInput() as HTMLInputElement;
      const toggleButton = document.querySelector(
        "#toggle-password-button",
      ) as HTMLButtonElement;

      expect(input).toHaveAttribute("type", "password");

      await user.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");

      await user.click(toggleButton);
      expect(input).toHaveAttribute("type", "password");
    });
  });

  describe("successful login", () => {
    test.each([
      ["ADMINISTRATOR", "/content-management"],
      ["Tutor", "/tutor/dashboard"],
      ["student", "/"],
      ["unknown", "/"],
    ])(
      "shows success message and navigates role %s to %s after redirect delay",
      async (role, expectedPath) => {
        const user = userEvent.setup();
        const setTimeoutSpy = mockSuccessfulRedirectDelay();

        mockLogin.mockResolvedValue({ role });

        renderPage();
        await fillLoginForm(user);
        await user.click(loginButton());

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith("student@gmail.com", "123456");
        });

        expect(
          await screen.findByText("Login successful! Redirecting..."),
        ).toBeInTheDocument();

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
        });

        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

        setTimeoutSpy.mockRestore();
      },
    );

    test("trims email before logging in", async () => {
      const user = userEvent.setup();
      const setTimeoutSpy = mockSuccessfulRedirectDelay();

      mockLogin.mockResolvedValue({
        role: "student",
      });

      renderPage();
      await fillLoginForm(user, "  student@gmail.com  ", "123456");
      await user.click(loginButton());

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("student@gmail.com", "123456");
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      setTimeoutSpy.mockRestore();
    });

    test("shows loading state while login request is pending", async () => {
      const user = userEvent.setup();

      let resolveLogin!: (value: { role: string }) => void;

      mockLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
      );

      renderPage();
      await fillLoginForm(user);
      await user.click(loginButton());

      expect(
        await screen.findByRole("button", { name: /logging in/i }),
      ).toBeDisabled();

      const setTimeoutSpy = mockSuccessfulRedirectDelay();

      resolveLogin({
        role: "student",
      });

      expect(
        await screen.findByText("Login successful! Redirecting..."),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      setTimeoutSpy.mockRestore();
    });
  });

  describe("failed login", () => {
    test.each([
      [
        "server error field",
        { error: "Invalid email or password" },
        "Invalid email or password",
      ],
      [
        "email field error",
        { email: "Email is required" },
        "Email is required",
      ],
      [
        "password field error",
        { password: "Password is required" },
        "Password is required",
      ],
      ["Error instance", new Error("Network error"), "Network error"],
      ["string error", "Server unavailable", "Server unavailable"],
      ["unknown error object", {}, "Invalid email or password"],
    ])("shows error message for %s", async (_, errorValue, expectedMessage) => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockLogin.mockRejectedValue(errorValue);

      renderPage();
      await fillLoginForm(user, "wrong@gmail.com", "wrongpassword");
      await user.click(loginButton());

      await waitFor(() => {
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("navigation buttons", () => {
    test.each([
      ["forgot password", /forgot password/i, "/forgot-password"],
      ["register", /^register$/i, "/register"],
    ])("navigates to %s page", async (_, buttonName, expectedPath) => {
      const user = userEvent.setup();

      renderPage();
      await user.click(screen.getByRole("button", { name: buttonName }));

      expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe("social login", () => {
    test.each([
      ["Google", /google/i, `${API_BASE}/oauth2/authorization/google`],
      ["Facebook", /facebook/i, `${API_BASE}/oauth2/authorization/facebook`],
    ])(
      "redirects to %s OAuth endpoint",
      async (_, buttonName, expectedHref) => {
        const user = userEvent.setup();
        const originalLocation = window.location;

        Object.defineProperty(window, "location", {
          configurable: true,
          value: {
            href: "",
          },
        });

        try {
          renderPage();

          await user.click(screen.getByRole("button", { name: buttonName }));

          expect(window.location.href).toBe(expectedHref);
        } finally {
          Object.defineProperty(window, "location", {
            configurable: true,
            value: originalLocation,
          });
        }
      },
    );
  });
});
