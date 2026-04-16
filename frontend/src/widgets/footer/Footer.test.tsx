import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";
import { describe, expect, it } from "vitest";

describe("Footer", ()=> {
	it("renders footer nav links", () => {
		render(
			<MemoryRouter>
				<Footer />
			</MemoryRouter>
		);

		const contactsLink = screen.getByRole("link", {name: /contacts/i});
		const aboutLink = screen.getByRole("link", {name: /about us/i});

		expect(contactsLink).toBeInTheDocument();
		expect(aboutLink).toBeInTheDocument();

		expect(contactsLink).toHaveAttribute("href", "/contacts");
		expect(aboutLink).toHaveAttribute("href", "/about");
	});

	it("marks current page link as active via aria-current", () => {
		render(
			<MemoryRouter initialEntries={["/about"]}>
				<Footer></Footer>
			</MemoryRouter>
		);

		const aboutLink = screen.getByRole("link", {name: /about us/i});
		expect(aboutLink).toHaveAttribute("aria-current", "page");
	});
});