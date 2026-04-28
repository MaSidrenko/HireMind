import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";
import "./SkillsAutoComplete.css";

type SkillsAutocompleteProps = {
	options: string[];
	maxSelected?: number;
	value?: string[];
	defaultValue?: string[];
	onChange?: (skills: string[]) => void;
	title?: string;
	description?: string;
	placeholder?: string;
	emptyText?: string;
	hideHeader?: boolean;
};

export default function SkillsAutocomplete({
	options,
	maxSelected = 10,
	value,
	defaultValue = [],
	onChange,
	title = "Ваши навыки",
	description,
	placeholder = "Начните вводить навык",
	emptyText = "Ничего не найдено",
	hideHeader = false,
}: SkillsAutocompleteProps) {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [internalSkills, setInternalSkills] =
		useState<string[]>(defaultValue);

	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const selectedSkills = value ?? internalSkills;
	const helperText =
		description ?? `Можно указать до ${maxSelected} специальностей`;

	const updateSkills = (nextSkills: string[]) => {
		if (value === undefined) {
			setInternalSkills(nextSkills);
		}

		onChange?.(nextSkills);
	};

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

		updateSkills([...selectedSkills, skill]);
		setQuery("");
		setIsOpen(false);
	};

	const handleRemove = (skillToRemove: string) => {
		updateSkills(selectedSkills.filter((skill) => skill !== skillToRemove));
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
			updateSkills(selectedSkills.slice(0, -1));
		}
	};

	return (
		<div className="skills-box">
			{!hideHeader && (
				<div className="skills-box__header">
					<h2>{title}</h2>
					<p>{helperText}</p>
				</div>
			)}

			<div className="selected-skills">
				{selectedSkills.map((skill) => (
					<button
						key={skill}
						type="button"
						className="skill-tag"
						onClick={() => handleRemove(skill)}
						aria-label={`Удалить навык ${skill}`}
					>
						{skill}
						<span aria-hidden="true">×</span>
					</button>
				))}
			</div>

			<div className="autocomplete" ref={wrapperRef}>
				<div className="input-wrapper">
					<input
						type="text"
						value={query}
						placeholder={placeholder}
						onChange={(e) => {
							setQuery(e.target.value);
							setIsOpen(true);
						}}
						onFocus={() => setIsOpen(true)}
						onKeyDown={handleKeyDown}
						disabled={selectedSkills.length >= maxSelected}
						aria-autocomplete="list"
						aria-expanded={isOpen}
					/>
					<span className="search-icon" aria-hidden="true">
						⌕
					</span>
				</div>

				{isOpen && filteredOptions.length > 0 && (
					<ul className="dropdown-skills">
						{filteredOptions.map((option, index) => (
							<li
								key={option}
								role="option"
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

				{isOpen &&
					query.trim() !== "" &&
					filteredOptions.length === 0 && (
						<div className="dropdown-skills dropdown-skills--empty">
							{emptyText}
						</div>
					)}
			</div>
		</div>
	);
}
