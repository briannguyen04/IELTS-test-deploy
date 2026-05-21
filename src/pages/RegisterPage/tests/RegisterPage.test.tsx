import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { RegisterPage } from "../RegisterPage";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE } from "../../../env";

const { mockNavigate, mockRegister } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockRegister: vi.fn(),
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

const renderPage = () => render(<RegisterPage />);

const firstNameInput = () =>
  screen.getByPlaceholderText("Enter your first name");
const lastNameInput = () => screen.getByPlaceholderText("Enter your last name");
const emailInput = () => screen.getByPlaceholderText("your.email@example.com");
const passwordInput = () => screen.getByPlaceholderText("Create a password");
const confirmPasswordInput = () =>
  screen.getByPlaceholderText("Confirm your password");

const registerButton = () =>
  screen.getByRole("button", { name: /^register$/i });

const fillRegisterForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }> = {},
) => {
  const data = {
    firstName: "Duy",
    lastName: "Huynh",
    email: "duy@gmail.com",
    password: "123456",
    confirmPassword: "123456",
    ...values,
  };

  if (data.firstName !== "") await user.type(firstNameInput(), data.firstName);
  if (data.lastName !== "") await user.type(lastNameInput(), data.lastName);
  if (data.email !== "") await user.type(emailInput(), data.email);
  if (data.password !== "") await user.type(passwordInput(), data.password);

  if (data.confirmPassword !== "") {
    await user.type(confirmPasswordInput(), data.confirmPassword);
  }
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

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      register: mockRegister,
    } as any);
  });

  describe("rendering", () => {
    test("renders register page layout and main actions", () => {
      renderPage();

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByTestId("background-image")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: /register/i }),
      ).toBeInTheDocument();

      expect(firstNameInput()).toBeInTheDocument();
      expect(lastNameInput()).toBeInTheDocument();
      expect(emailInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(confirmPasswordInput()).toBeInTheDocument();
      expect(registerButton()).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /google/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /facebook/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /^login$/i }),
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    test.each([
      [
        "all fields are empty",
        {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        },
        "First name is required",
      ],
      ["first name is empty", { firstName: "" }, "First name is required"],
      ["last name is empty", { lastName: "" }, "Last name is required"],
      ["email is empty", { email: "" }, "Email is required"],
      ["password is empty", { password: "" }, "Password is required"],
      [
        "confirm password is empty",
        { confirmPassword: "" },
        "Confirm password is required",
      ],
    ])(
      "shows required-field validation error when %s",
      async (_, overrideValues, expectedMessage) => {
        const user = userEvent.setup();

        renderPage();
        await fillRegisterForm(user, overrideValues);
        await user.click(registerButton());

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      },
    );

    test("shows validation error when email format is invalid", async () => {
      const user = userEvent.setup();

      renderPage();
      await fillRegisterForm(user, {
        email: "invalid-email",
      });
      await user.click(registerButton());

      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("shows validation error when passwords do not match", async () => {
      const user = userEvent.setup();

      renderPage();
      await fillRegisterForm(user, {
        password: "123456",
        confirmPassword: "654321",
      });
      await user.click(registerButton());

      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("password visibility", () => {
    test("toggles password and confirm password input types", async () => {
      const user = userEvent.setup();

      renderPage();

      const password = passwordInput() as HTMLInputElement;
      const confirmPassword = confirmPasswordInput() as HTMLInputElement;

      const passwordToggleButton = document.querySelector(
        "#register-password-toggle-button",
      ) as HTMLButtonElement;

      const confirmPasswordToggleButton = document.querySelector(
        "#register-confirm-password-toggle-button",
      ) as HTMLButtonElement;

      expect(password).toHaveAttribute("type", "password");
      expect(confirmPassword).toHaveAttribute("type", "password");

      await user.click(passwordToggleButton);
      expect(password).toHaveAttribute("type", "text");

      await user.click(passwordToggleButton);
      expect(password).toHaveAttribute("type", "password");

      await user.click(confirmPasswordToggleButton);
      expect(confirmPassword).toHaveAttribute("type", "text");

      await user.click(confirmPasswordToggleButton);
      expect(confirmPassword).toHaveAttribute("type", "password");
    });
  });

  describe("successful registration", () => {
    test("calls register with submitted values, shows success message, and navigates to login page", async () => {
      const user = userEvent.setup();
      const setTimeoutSpy = mockSuccessfulRedirectDelay();

      mockRegister.mockResolvedValue({
        success: true,
      });

      renderPage();
      await fillRegisterForm(user);
      await user.click(registerButton());

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          "Duy",
          "Huynh",
          "duy@gmail.com",
          "123456",
        );
      });

      expect(
        await screen.findByText(
          "Registration successful! Redirecting to login page...",
        ),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

      setTimeoutSpy.mockRestore();
    });

    test("trims first name, last name, and email before registering", async () => {
      const user = userEvent.setup();
      const setTimeoutSpy = mockSuccessfulRedirectDelay();

      mockRegister.mockResolvedValue({
        success: true,
      });

      renderPage();
      await fillRegisterForm(user, {
        firstName: "  Duy  ",
        lastName: "  Huynh  ",
        email: "  duy@gmail.com  ",
      });
      await user.click(registerButton());

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          "Duy",
          "Huynh",
          "duy@gmail.com",
          "123456",
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });

      setTimeoutSpy.mockRestore();
    });

    test("shows loading state while registration request is pending", async () => {
      const user = userEvent.setup();

      let resolveRegister!: (value: { success: boolean }) => void;

      mockRegister.mockReturnValue(
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
      );

      renderPage();
      await fillRegisterForm(user);
      await user.click(registerButton());

      expect(
        await screen.findByRole("button", { name: /registering/i }),
      ).toBeDisabled();

      const setTimeoutSpy = mockSuccessfulRedirectDelay();

      resolveRegister({
        success: true,
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });

      setTimeoutSpy.mockRestore();
    });
  });

  describe("failed registration", () => {
    test.each([
      [
        "server error object with error property",
        {
          error: "Email already exists",
        },
        "Email already exists",
      ],
      [
        "server error object with raw colon message",
        {
          error: "email: Email already exists",
        },
        "email: Email already exists",
      ],
      ["thrown Error instance", new Error("Network error"), "Network error"],
      ["string error", "Server is unavailable", "Server is unavailable"],
      ["unknown error object", {}, "Registration failed. Please try again."],
    ])("shows general error message for %s", async (_, errorValue, message) => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockRegister.mockRejectedValue(errorValue);

      renderPage();
      await fillRegisterForm(user);
      await user.click(registerButton());

      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("navigation", () => {
    test("navigates to login page", async () => {
      const user = userEvent.setup();

      renderPage();

      await user.click(screen.getByRole("button", { name: /^login$/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("social registration", () => {
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
