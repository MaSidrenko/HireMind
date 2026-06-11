import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "./Profile";
import { updateProfileSkills, useAuth } from "@/features";
import { getAcceptedProject } from "@/features/projects/projectsApi";

vi.mock("@/features", () => ({
	useAuth: vi.fn(),
	updateProfileSkills: vi.fn(),
}));

vi.mock("@/features/projects/projectsApi", () => ({
	getAcceptedProject: vi.fn(),
}));

type SkillsAutocompleteProps = {
	options: string[];
	maxSelected: number;
	value: string[];
	onChange: (skills: string[]) => void | Promise<void>;
	hideHeader?: boolean;
	placeholder?: string;
	emptyText?: string;
};

vi.mock("@/widgets/SkillsAutoComplete/SkillsAutoComplete", () => ({
	default: ({ value, onChange, placeholder }: SkillsAutocompleteProps) => (
		<div data-testid="skills-autocomplete">
			<input placeholder={placeholder} readOnly />

			<div data-testid="skills-value">{value.join(", ")}</div>

			<button type="button" onClick={() => onChange([...value, "React"])}>
				Добавить React
			</button>
		</div>
	),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUpdateProfileSkills = vi.mocked(updateProfileSkills);
const mockedGetAcceptedProject = vi.mocked(getAcceptedProject);

const logoutMock = vi.fn();
const replaceUserMock = vi.fn();
const updateProfileMock = vi.fn();
const refreshAuthMock = vi.fn();

const freelanceUser = {
	id: 1,
	fullName: "John Doe",
	email: "john.doe@exapmle.com",
	role: "Freelancer",
	isOnline: true,
	isTelegramConnected: false,
	rating: 0,
	contacts: {
		telegram: "@john_doe",
		phone: "+792583456789",
	},
	skills: ["TypeScript"],
	hourlyRate: null,
	currency: null,
	completedOrders: 0,
};

const clientUser = {
	id: 2,
	fullName: "Alice Smith",
	email: "alice@exapmle.com",
	role: "Client",
	isOnline: false,
	isTelegramConnected: false,
	rating: 0,
	contacts: {
		telegram: "",
		phone: "",
	},
	companyName: "Acme Company",
};

function mockAuth(user: unknown) {
	mockedUseAuth.mockReturnValue({
		user,
		logout: logoutMock,
		replaceUser: replaceUserMock,
		updateProfile: updateProfileMock,
		refreshAuth: refreshAuthMock,
		signIn: vi.fn(),
		signUp: vi.fn(),
		isAuthenticated: Boolean(user),
		loading: false,
	} as ReturnType<typeof useAuth>);
}

function renderProfile() {
	return render(
		<MemoryRouter>
			<Profile />
		</MemoryRouter>,
	);
}

describe("Profile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUpdateProfileSkills.mockReturnValue(undefined);
		mockedGetAcceptedProject.mockResolvedValue([]);
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("Nothing to render, if user is null", () => {
		mockAuth(null);

		const { container } = renderProfile();
		expect(container).toBeEmptyDOMElement();
	});

	it("render freelancer profile", async () => {
		mockAuth(freelanceUser);

		renderProfile();

		expect(
			screen.getByRole("heading", { name: "John Doe" }),
		).toBeInTheDocument();
		expect(screen.getByText("john.doe@exapmle.com")).toBeInTheDocument();
		expect(screen.getAllByText("Исполнитель").length).toBeGreaterThan(0);
		expect(screen.getByText("В сети")).toBeInTheDocument();

		expect(screen.getByTestId("skills-autocomplete")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Добавьте специальность"),
		).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("skills-value")).toHaveTextContent(
				"TypeScript",
			);
		});
	});

	it('Render client profile, with out block "Специальности"', () => {
		mockAuth(clientUser);

		renderProfile();

		expect(
			screen.getByRole("heading", { name: "Alice Smith" }),
		).toBeInTheDocument();
		expect(screen.getByText("alice@exapmle.com")).toBeInTheDocument();
		expect(screen.getAllByText("Заказчик").length).toBeGreaterThan(0);
		expect(screen.getByText("Не в сети")).toBeInTheDocument();
		expect(screen.getAllByText("Acme Company").length).toBeGreaterThan(0);

		expect(
			screen.queryByTestId("skills-autocomplete"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText("Добавьте специальность"),
		).not.toBeInTheDocument();
	});
	it("сохраняет специальности фрилансера через updateProfileSkills", async () => {
		const user = userEvent.setup();

		let resolveSave!: () => void;

		mockedUpdateProfileSkills.mockReturnValue(
			new Promise<void>((resolve) => {
				resolveSave = resolve;
			}),
		);

		mockAuth(freelanceUser);

		renderProfile();

		await user.click(
			screen.getByRole("button", { name: "Добавить React" }),
		);

		expect(mockedUpdateProfileSkills).toHaveBeenCalledTimes(1);
		expect(mockedUpdateProfileSkills).toHaveBeenCalledWith([
			"TypeScript",
			"React",
		]);

		expect(screen.getByText("Сохраняем...")).toBeInTheDocument();

		resolveSave();

		await waitFor(() => {
			expect(screen.queryByText("Сохраняем...")).not.toBeInTheDocument();
		});

		expect(screen.getByTestId("skills-value")).toHaveTextContent(
			"TypeScript, React",
		);
	});

	it("откатывает специальности назад и показывает ошибку, если сохранение упало", async () => {
		const user = userEvent.setup();

		mockedUpdateProfileSkills.mockRejectedValue(
			new Error("Request failed"),
		);

		mockAuth(freelanceUser);

		renderProfile();

		await waitFor(() => {
			expect(screen.getByTestId("skills-value")).toHaveTextContent(
				"TypeScript",
			);
		});

		await user.click(
			screen.getByRole("button", { name: "Добавить React" }),
		);

		expect(mockedUpdateProfileSkills).toHaveBeenCalledWith([
			"TypeScript",
			"React",
		]);

		await waitFor(() => {
			expect(
				screen.getByText("Не удалось сохранить специальности"),
			).toBeInTheDocument();
		});

		expect(screen.getByTestId("skills-value")).toHaveTextContent(
			"TypeScript",
		);
		expect(screen.getByTestId("skills-value")).not.toHaveTextContent(
			"TypeScript, React",
		);
	});

	it("вызывает logout при клике на кнопку выхода", async () => {
		const user = userEvent.setup();

		mockAuth(freelanceUser);

		renderProfile();

		await user.click(
			screen.getByRole("button", { name: "Выйти из аккаунта" }),
		);

		expect(logoutMock).toHaveBeenCalledTimes(1);
	});
});
