import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useObsidianContext } from "./ObsidianContext";
import { Inputs } from "./ReactApp";

type Props = Readonly<{
  id: string;
  placeholder?: string;
}>;

export const TagInput = ({ id, placeholder }: Props) => {
  const { plugin } = useObsidianContext();
  const { register, setValue, watch } = useFormContext<Inputs>();
  const tagsValue = watch("tags");

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch available tags from Obsidian's metadata cache
  useEffect(() => {
    try {
      // @ts-ignore - getTags() exists but isn't in the official type definitions
      const tagsObject = plugin.app.metadataCache.getTags();
      // Extract tag names and remove the # prefix
      const tagsList = Object.keys(tagsObject).map((tag) =>
        tag.startsWith("#") ? tag.substring(1) : tag,
      );
      // Sort tags alphabetically
      tagsList.sort((a, b) => a.localeCompare(b));
      setAvailableTags(tagsList);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, [plugin.app.metadataCache]);

  // Get the current tag being typed (the partial tag at cursor position)
  const getCurrentTag = (value: string, position: number): string => {
    // Find the start of the current tag (after the last space before cursor)
    let start = position;
    while (start > 0 && value[start - 1] !== " ") {
      start--;
    }

    // Find the end of the current tag (before the next space after cursor)
    let end = position;
    while (end < value.length && value[end] !== " ") {
      end++;
    }

    return value.substring(start, end).trim();
  };

  // Filter suggestions based on current input
  const updateSuggestions = (value: string, position: number) => {
    const currentTag = getCurrentTag(value, position);

    if (!currentTag) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter tags where any segment (split by /) starts with the current partial tag
    const filtered = availableTags.filter((tag) => {
      const segments = tag.toLowerCase().split("/");
      const input = currentTag.toLowerCase();
      return segments.some((segment) => segment.startsWith(input));
    });

    // Limit to 10 suggestions
    setSuggestions(filtered.slice(0, 10));
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(0);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setValue("tags", value);
    setCursorPosition(position);
    updateSuggestions(value, position);
  };

  // Handle clicking on input (update cursor position)
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const position = (e.target as HTMLInputElement).selectionStart || 0;
    setCursorPosition(position);
    updateSuggestions(tagsValue || "", position);
  };

  // Insert selected tag at cursor position
  const insertTag = (tag: string) => {
    const value = tagsValue || "";

    // Find the start position of the current tag
    let start = cursorPosition;
    while (start > 0 && value[start - 1] !== " ") {
      start--;
    }

    // Find the end position of the current tag
    let end = cursorPosition;
    while (end < value.length && value[end] !== " ") {
      end++;
    }

    // Replace the current tag with the selected tag
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + tag + " " + after;

    setValue("tags", newValue.trim());
    setShowSuggestions(false);

    // Set focus back to input and move cursor after the inserted tag
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPos = start + tag.length + 1;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          insertTag(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        {...register("tags")}
        placeholder={placeholder}
        id={id}
        ref={(e) => {
          register("tags").ref(e);
          // @ts-ignore
          inputRef.current = e;
        }}
        onChange={handleInputChange}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="create-task__tag-suggestions">
          {suggestions.map((tag, index) => (
            <div
              key={tag}
              className={`create-task__tag-suggestion ${
                index === selectedIndex
                  ? "create-task__tag-suggestion--selected"
                  : ""
              }`}
              onClick={() => insertTag(tag)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="create-task__tag-suggestion-text">#{tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
