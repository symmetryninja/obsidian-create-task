import { StrictMode, useId, useRef } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import CreateTask from "src/main";
import { Date } from "./Date";
import { ObsidianProvider } from "./ObsidianContext";
import { Preview } from "./Preview";
import { Inputs } from "./ReactApp";
import { TagInput } from "./TagInput";

type Props = Readonly<{
  plugin: CreateTask;
}>;

export const EmbeddedView = ({ plugin }: Props) => {
  const methods = useForm<Inputs>({
    defaultValues: {
      customNoteIndex: "default",
      taskDescription: "",
      tags: "",
      taskDetails: "",
      dueDate: "Today",
    },
  });

  const customNoteIndex = methods.watch("customNoteIndex");
  const taskDescription = methods.watch("taskDescription");
  const tags = methods.watch("tags");
  const taskDetails = methods.watch("taskDetails");
  const dueDate = methods.watch("dueDate");

  const targetNoteId = useId();
  const taskDescriptionId = useId();
  const tagsId = useId();
  const taskDetailsId = useId();

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await plugin.createTask(
      data.customNoteIndex === "default"
        ? "default"
        : parseInt(data.customNoteIndex),
      data.taskDescription,
      data.dueDate,
      data.taskDetails,
      data.tags,
    );

    // Reset form after submission
    methods.setValue("taskDescription", "");
    methods.setValue("tags", "");
    methods.setValue("taskDetails", "");
    methods.setFocus("taskDescription");
  };

  const options = plugin.settings.customNotes.map((customNote, index) => (
    <option key={index} value={index}>
      {customNote.name}
    </option>
  ));

  return (
    <StrictMode>
      <ObsidianProvider plugin={plugin}>
        <div className="create-task__create-modal create-task__embedded-view">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <div className="create-task__create-modal-row">
                <div className="create-task__create-modal-left">
                  <div className="create-task__create-modal-icon">📁</div>

                  <div>
                    <label htmlFor={targetNoteId}>Target note</label>
                  </div>
                </div>

                <div className="create-task__create-modal-right">
                  <select
                    className="dropdown"
                    autoFocus
                    {...methods.register("customNoteIndex", {
                      required: true,
                    })}
                    id={targetNoteId}
                  >
                    <option value="default">Default</option>
                    {options}
                  </select>
                </div>
              </div>

              <div className="create-task__create-modal-row">
                <div className="create-task__create-modal-left">
                  <div className="create-task__create-modal-icon">🖊️</div>

                  <div>
                    <label htmlFor={taskDescriptionId}>Task description</label>
                  </div>
                </div>

                <div className="create-task__create-modal-right">
                  <input
                    type="text"
                    {...methods.register("taskDescription", { required: true })}
                    placeholder="My task"
                    id={taskDescriptionId}
                  />

                  {methods.formState.errors.taskDescription && (
                    <p className="create-task__error">
                      This field is required.
                    </p>
                  )}
                </div>
              </div>

              <div className="create-task__create-modal-row">
                <div className="create-task__create-modal-left">
                  <div className="create-task__create-modal-icon">🏷️</div>

                  <div>
                    <label htmlFor={tagsId}>Tags</label>
                  </div>
                </div>

                <div className="create-task__create-modal-right">
                  <TagInput id={tagsId} placeholder="e.g., urgent, work" />
                </div>
              </div>

              {!plugin.settings.hideDetailsField && (
                <div className="create-task__create-modal-row">
                  <div className="create-task__create-modal-left">
                    <div className="create-task__create-modal-icon">🖊️</div>

                    <div>
                      <label htmlFor={taskDetailsId}>Details</label>
                    </div>
                  </div>

                  <div className="create-task__create-modal-right">
                    <textarea
                      rows={5}
                      {...methods.register("taskDetails")}
                      id={taskDetailsId}
                    />
                  </div>
                </div>
              )}

              <Date nextFocusRef={submitButtonRef} />

              <div className="create-task__create-modal-actions">
                <button type="submit" className="mod-cta" ref={submitButtonRef}>
                  Create
                </button>
              </div>
            </form>
          </FormProvider>

          <Preview
            customNoteIndex={customNoteIndex}
            taskDescription={taskDescription}
            tags={tags}
            taskDetails={taskDetails}
            dueDate={dueDate}
          />
        </div>
      </ObsidianProvider>
    </StrictMode>
  );
};
