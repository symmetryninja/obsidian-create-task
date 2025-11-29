import clsx from "clsx";
import { useObsidianContext } from "./ObsidianContext";

type Props = Readonly<{
  className?: string;
  notePath?: string;
  customNoteIndex: "default" | string;
  taskDescription: string;
  tags: string;
  taskDetails: string;
  dueDate: string;
}>;

export const Preview = ({
  className,
  notePath,
  customNoteIndex,
  taskDescription,
  tags,
  taskDetails,
  dueDate,
}: Props) => {
  const { plugin } = useObsidianContext();

  let to: string;
  let task: string;

  if (notePath) {
    to = notePath;
    task = plugin.compileLine(
      tags || undefined,
      taskDescription,
      dueDate,
      taskDetails,
    );
  } else if (customNoteIndex === "default") {
    to = plugin.settings.defaultNote;

    // Merge default tag with user-provided tags (same logic as in main.ts)
    const allTags = [plugin.settings.defaultTag, tags]
      .filter(Boolean)
      .join(" ");

    task = plugin.compileLine(
      allTags || undefined,
      taskDescription,
      dueDate,
      taskDetails,
    );
  } else {
    const customNote = plugin.settings.customNotes[parseInt(customNoteIndex)];
    to = customNote.path;

    // Merge custom note tag with user-provided tags (same logic as in main.ts)
    const allTags = [customNote.tag, tags].filter(Boolean).join(" ");

    task = plugin.compileLine(
      allTags || undefined,
      taskDescription,
      dueDate,
      taskDetails,
    );
  }

  return (
    <div className={clsx(className)}>
      <h2>
        Preview (<i>{to}</i>){" "}
      </h2>
      <pre>
        <code className="create-task__preview">{task}</code>
      </pre>
    </div>
  );
};
