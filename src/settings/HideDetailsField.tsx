import clsx from "clsx";
import { useId, useState } from "react";
import { useObsidianContext } from "./ObsidianContext";

type Props = Readonly<{
  className?: string;
}>;

export const HideDetailsField = ({ className }: Props) => {
  const { plugin } = useObsidianContext();
  const [value, setValue] = useState(plugin.settings.hideDetailsField || false);
  const id = useId();

  const handleChange = async () => {
    setValue(!value);
    plugin.settings.hideDetailsField = !value;
    await plugin.saveSettings();
  };

  return (
    <section className={clsx(className, "setting-item")}>
      <div className="setting-item-info">
        <label htmlFor={id} className="setting-item-name">
          Hide details field
        </label>

        <div className="setting-item-description">
          Enable this to hide the "Details" field from the task creation modal
          and embedded view.
        </div>
      </div>

      <div className="setting-item-control">
        <div
          className={clsx("checkbox-container", {
            "is-enabled": value,
          })}
          onClick={handleChange}
        >
          <input
            type="checkbox"
            id={id}
            checked={value}
            onChange={handleChange}
          />
        </div>
      </div>
    </section>
  );
};
