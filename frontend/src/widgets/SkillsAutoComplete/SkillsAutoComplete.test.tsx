import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SkillsAutocomplete from "./SkillsAutoComplete";

const skills = [
	"React",
	"TypeScript",
	"JavaScript",
	"Node.js",
	"HTML",
	"CSS",
	"Redux",
];

describe("SkillsAutocomplete", () => {
	it("renders title, limit text and input", () => {
		render(<SkillsAutocomplete options={skills} />);

		expect(screen.getByText("Ваши навыки")).toBeInTheDocument();
		expect(
			screen.getByText("Можно указать до 10 специальностей"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Начните вводить навык"),
		).toBeInTheDocument();
	});

	it("opens dropdown on focus and shows options", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);

		expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "TypeScript" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "JavaScript" }),
		).toBeInTheDocument();
	});

	it("filters options by typed query", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.type(input, "rea");

		expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();

		expect(
			screen.queryByRole("option", { name: "TypeScript" }),
		).not.toBeInTheDocument();

		expect(
			screen.queryByRole("option", { name: "JavaScript" }),
		).not.toBeInTheDocument();
	});

	it("selects skill by click and clears input", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText(
			"Начните вводить навык",
		) as HTMLInputElement;

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "React" }));

		expect(
			screen.getByRole("button", { name: "Удалить навык React" }),
		).toBeInTheDocument();

		expect(input.value).toBe("");
		expect(
			screen.queryByRole("option", { name: "React" }),
		).not.toBeInTheDocument();
	});

	it("removes selected skill on tag click", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "React" }));

		const tag = screen.getByRole("button", {
			name: "Удалить навык React",
		});

		expect(tag).toBeInTheDocument();

		await user.click(tag);

		expect(
			screen.queryByRole("button", { name: "Удалить навык React" }),
		).not.toBeInTheDocument();
	});

	it("does not show already selected skill in dropdown", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "React" }));

		await user.click(input);

		expect(
			screen.queryByRole("option", { name: "React" }),
		).not.toBeInTheDocument();

		expect(
			screen.getByRole("option", { name: "TypeScript" }),
		).toBeInTheDocument();
	});

	it("shows empty state when nothing is found", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.type(input, "Python");

		expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
	});

	it("disables input when maxSelected is reached", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} maxSelected={2} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "React" }));

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "TypeScript" }));

		expect(input).toBeDisabled();
	});

	it("removes last selected skill on Backspace when input is empty", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);
		await user.click(screen.getByRole("option", { name: "React" }));

		await user.click(input);
		await user.keyboard("{Backspace}");

		expect(
			screen.queryByRole("button", { name: "Удалить навык React" }),
		).not.toBeInTheDocument();
	});

	it("supports keyboard navigation and Enter selection", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);
		await user.keyboard("{ArrowDown}");
		await user.keyboard("{Enter}");

		expect(
			screen.getByRole("button", { name: "Удалить навык TypeScript" }),
		).toBeInTheDocument();
	});

	it("closes dropdown on Escape", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);

		expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();

		await user.keyboard("{Escape}");

		expect(
			screen.queryByRole("option", { name: "React" }),
		).not.toBeInTheDocument();
	});

	it("closes dropdown on outside click", async () => {
		const user = userEvent.setup();
		render(<SkillsAutocomplete options={skills} />);

		const input = screen.getByPlaceholderText("Начните вводить навык");

		await user.click(input);

		expect(screen.getByRole("option", { name: "React" })).toBeInTheDocument();

		fireEvent.mouseDown(document.body);

		expect(
			screen.queryByRole("option", { name: "React" }),
		).not.toBeInTheDocument();
	});
});