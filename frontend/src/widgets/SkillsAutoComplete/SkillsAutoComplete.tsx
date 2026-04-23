import { useEffect, useMemo, useRef, useState } from "react";
import "./SkillsAutoComplete.css";

type SkillsAutocompleteProps = {
	options: string[];
	maxSelected?: number;
};

export default function SkillsAutocomplete({
	options,
	maxSelected = 10,
}: SkillsAutocompleteProps) {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const filteredOptions = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return options.filter((option) => {
			const alreadySelected = selectedSkills.includes(option);

			if (alreadySelected) return false;
			if (!normalizedQuery) return true;

			return option.toLowerCase().includes(normalizedQuery);
		});
	}, [options, query, selectedSkills]);

	useEffect(() => {
		setHighlightedIndex(0);
	}, [query]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSelect = (skill: string) => {
		if (selectedSkills.length >= maxSelected) return;

		setSelectedSkills((prev) => [...prev, skill]);
		setQuery("");
		setIsOpen(false);
	};

	const handleRemove = (skillToRemove: string) => {
		setSelectedSkills((prev) =>
			prev.filter((skill) => skill !== skillToRemove),
		);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
			setIsOpen(true);
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setHighlightedIndex((prev) =>
				prev < filteredOptions.length - 1 ? prev + 1 : prev,
			);
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
		}

		if (event.key === "Enter") {
			if (isOpen && filteredOptions[highlightedIndex]) {
				event.preventDefault();
				handleSelect(filteredOptions[highlightedIndex]);
			}
		}

		if (event.key === "Escape") {
			setIsOpen(false);
		}

		if (
			event.key === "Backspace" &&
			query === "" &&
			selectedSkills.length > 0
		) {
			setSelectedSkills((prev) => prev.slice(0, -1));
		}
	};

	return (
		<div className="skills-box">
			<h2>Ваши навыки</h2>
			<p>Можно указать до {maxSelected} навыков</p>

			<div className="selected-skills">
				{selectedSkills.map((skill) => (
					<button
						key={skill}
						type="button"
						className="skill-tag"
						onClick={() => handleRemove(skill)}
					>
						{skill} ×
					</button>
				))}
			</div>

			<div className="autocomplete" ref={wrapperRef}>
				<div className="input-wrapper">
					<input
						type="text"
						value={query}
						placeholder="Начните вводить навык"
						onChange={(e) => {
							setQuery(e.target.value);
							setIsOpen(true);
						}}
						onFocus={() => setIsOpen(true)}
						onKeyDown={handleKeyDown}
						disabled={selectedSkills.length >= maxSelected}
					/>
					<span className="search-icon">⌕</span>
				</div>

				{isOpen && filteredOptions.length > 0 && (
					<ul className="dropdown-skills">
						{filteredOptions.map((option, index) => (
							<li
								key={option}
								className={
									index === highlightedIndex ? "active" : ""
								}
								onMouseDown={() => handleSelect(option)}
							>
								{option}
							</li>
						))}
					</ul>
				)}

				{isOpen && query.trim() !== "" && filteredOptions.length === 0 && (
					<div className="dropdown empty">Ничего не найдено</div>
				)}
			</div>
		</div>
	);
}