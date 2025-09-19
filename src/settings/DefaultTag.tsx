import clsx from "clsx";
import { useId, useState } from "react";
import { useObsidianContext } from "./ObsidianContext";
import { CreateTaskSettings } from "./types";

type Props = Readonly<{
  className?: string;
}>;

export const DefaultTag = ({ className }: Props) => {
  const { plugin } = useObsidianContext();
  const [value, setValue] = useState(plugin.settings.defaultTag || "");
  const id = useId();

  const save = async (value: CreateTaskSettings["defaultTag"]) => {
    plugin.settings.defaultTag = value;
    await plugin.saveSettings();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    save(value);
  };

  const handleBlur = async () => {
    if (value === plugin.settings.defaultTag) return;
    save(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(className, "create-task__default-tag")}
    >
      <div className="setting-item">
        <div className="setting-item-info">
          <label htmlFor={id} className="setting-item-name">
            Default tags
          </label>

          <div className="setting-item-description">
            Optional tag that will be automatically added to tasks created with
            the default profile. Don't include the # symbol.
          </div>
        </div>

        <div className="setting-item-control">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="e.g., task, todo"
            id={id}
          />
        </div>
      </div>
    </form>
  );
};
