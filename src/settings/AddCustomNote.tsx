import clsx from "clsx";
import { Save } from "lucide-react";
import { useId } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useObsidianContext } from "./ObsidianContext";

type Inputs = {
  notePath: string;
  displayName: string;
  tag: string;
};

type Props = Readonly<{
  className?: string;
}>;

export const AddCustomNote = ({ className }: Props) => {
  const { plugin, addCustomNote } = useObsidianContext();
  const notePathId = useId();
  const displayNameId = useId();
  const tagId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setFocus,
    setError,
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await plugin.getFile(data.notePath);
    } catch (error) {
      setError("notePath", {
        type: "manual",
        message: "This file doesn't exist.",
      });

      return;
    }

    await addCustomNote({
      path: data.notePath,
      name: data.displayName,
      tag: data.tag,
    });

    setValue("notePath", "");
    setValue("displayName", "");
    setValue("tag", "");

    setFocus("notePath");
  };

  return (
    <section className={clsx(className, "create-task__add-custom-note")}>
      <h2>Add custom note</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="create-task__add-custom-note-grid"
      >
        <div>
          <label
            htmlFor={notePathId}
            className="create-task__add-custom-note-column-label"
          >
            Note path
          </label>

          <input
            type="text"
            id={notePathId}
            defaultValue=""
            {...register("notePath", { required: true })}
          />

          {errors.notePath && (
            <p className="create-task__error">
              {errors.notePath.message || "This field is required."}
            </p>
          )}

          <p className="create-task__info">The file path of this note.</p>
        </div>

        <div>
          <label
            htmlFor={displayNameId}
            className="create-task__add-custom-note-column-label"
          >
            Display name
          </label>

          <input
            type="text"
            id={displayNameId}
            defaultValue=""
            {...register("displayName", { required: true })}
          />

          {errors.displayName && (
            <p className="create-task__error">
              {errors.displayName.message || "This field is required."}
            </p>
          )}

          <p className="create-task__info">
            A custom name for this note. This will only be used within the
            modal.
          </p>
        </div>

        <div>
          <label
            htmlFor={tagId}
            className="create-task__add-custom-note-column-label"
          >
            Tags (optional)
          </label>

          <input type="text" id={tagId} defaultValue="" {...register("tag")} />

          <p className="create-task__info">
            This tag will get added to the task.
          </p>
        </div>

        <div className="create-task__add-custom-note-actions">
          <div className="create-task__add-custom-note-column-label">
            &nbsp;
          </div>

          <button type="submit" className="mod-cta">
            Add
            <Save className="svg-icon" />
          </button>
        </div>
      </form>
    </section>
  );
};
