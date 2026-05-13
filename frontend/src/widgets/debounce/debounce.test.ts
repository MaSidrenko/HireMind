import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./debounce";

describe("useDebounce", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns previous value until delay passes", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ value }) => useDebounce(value, 300),
			{ initialProps: { value: "first" } },
		);

		rerender({ value: "second" });

		expect(result.current).toBe("first");

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current).toBe("second");
	});
});
