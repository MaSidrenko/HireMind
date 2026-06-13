import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../shared";
import { updateProfileSkills } from "./updateProfileSkills";

vi.mock("@/shared", () => ({
	apiRequest: vi.fn(),
	PROFILE_API: "/profile",
}));

const mockedApiRequest = vi.mocked(apiRequest);

describe("updateProfileSkills", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("patches profile skills", async () => {
		mockedApiRequest.mockResolvedValueOnce({ ok: true });

		await expect(updateProfileSkills(["React", "TypeScript"])).resolves.toEqual({
			ok: true,
		});

		expect(mockedApiRequest).toHaveBeenCalledWith("/profile/skills", {
			method: "PATCH",
			body: {
				skills: ["React", "TypeScript"],
			},
		});
	});
});
