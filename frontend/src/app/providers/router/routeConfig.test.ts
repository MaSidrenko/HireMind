import { describe, expect, it } from "vitest";
import { PageRoutes } from "./routeConfig";

describe("PageRoutes", () => {
	it("does not contain duplicate paths", () => {
		const paths = PageRoutes.map((route) => route.path);

		expect(new Set(paths).size).toBe(paths.length);
	});

	it("keeps main navigation routes intentional", () => {
		expect(PageRoutes.filter((route) => route.showInNavbar)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: "/", access: "public" }),
				expect.objectContaining({ path: "/projects", access: "public" }),
				expect.objectContaining({ path: "/freelancers", access: "Client" }),
				expect.objectContaining({ path: "/profile", access: "private" }),
			]),
		);
		expect(
			PageRoutes.find((route) => route.path === "/projects/new")?.showInNavbar,
		).toBe(false);
		expect(
			PageRoutes.find((route) => route.path === "/recovery-password"),
		).toEqual(
			expect.objectContaining({
				path: "/recovery-password",
				access: "guest",
				showInNavbar: false,
			}),
		);
	});
});
