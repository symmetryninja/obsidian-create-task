import { parseDate } from "chrono-node";
import { Notice, Plugin, TFile } from "obsidian";
import { gte } from "semver";
import { CreateTaskChangelogModal } from "./ChangelogModal";
import { CreateTaskCreateModal } from "./CreateModal";
import { CreateTaskOnboardingModal } from "./OnboardingModal";
import { CreateTaskSettingTab, DEFAULT_SETTINGS } from "./settings";
import { CreateTaskSettings } from "./settings/types";

export default class CreateTask extends Plugin {
  settings: CreateTaskSettings;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("check-square", "Create Task", () => {
      this.openCreateModal();
    });

    this.addCommand({
      id: "open-modal",
      name: "Create",
      icon: "check-square",
      callback: () => {
        this.openCreateModal();
      },
    });

    this.addCommand({
      id: "open-changelog",
      name: "Changelog",
      icon: "package-plus",
      callback: () => {
        this.openChangelogModal();
      },
    });

    this.addCommand({
      id: "open-settings",
      name: "Settings",
      icon: "settings",
      checkCallback: (checking) => {
        // Make sure this.app.setting is available since it's an undocumented/internal API
        // @ts-ignore
        if (checking && this.app.setting?.open && this.app.setting?.openTabById)
          return true;

        this.openSettings();
      },
    });

    this.addSettingTab(new CreateTaskSettingTab(this.app, this));

    this.registerObsidianProtocolHandler("create-task", (params) => {
      if (
        params["create"] === "true" &&
        params["note-path"] &&
        this.app.vault.getAbstractFileByPath(params["note-path"])
      ) {
        this.createTask(
          params["note-path"],
          params["task-description"],
          params["due-date"],
          params["task-details"],
        );
      } else {
        new CreateTaskCreateModal(this.app, this, {
          notePath: params["note-path"],
          taskDescription: params["task-description"],
          dueDate: params["due-date"],
          taskDetails: params["task-details"],
        }).open();
      }
    });

    await this.firstOnboarding();

    await this.changelogModal();
  }

  async changelogModal() {
    const lastChangelog = this.settings.lastChangelog || "1.3.5"; // Changelog detection was added in 1.4.0
    if (gte(lastChangelog, this.manifest.version)) return;
    this.settings.lastChangelog = this.manifest.version;
    await this.saveSettings(true);

    if (this.settings.disableChangelog) return;

    this.openChangelogModal(lastChangelog);
  }

  openChangelogModal(lastChangelog?: string) {
    new CreateTaskChangelogModal(this.app, this, lastChangelog).open();
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(skipNotice = false) {
    await this.saveData(this.settings);

    if (skipNotice) return;
    new Notice("Create Task: Settings saved");
  }

  openCreateModal() {
    if (!this.settings.defaultNote) {
      new Notice("Create Task: You must set the Default note setting");
      this.openOnboardingModal();
      return;
    }

    new CreateTaskCreateModal(this.app, this, undefined).open();
  }

  openOnboardingModal() {
    new CreateTaskOnboardingModal(this.app, this).open();
  }

  openSettings() {
    // @ts-ignore
    this.app.setting.open?.();
    // @ts-ignore
    this.app.setting.openTabById?.(this.manifest.id);
  }

  async createTask(
    customNoteIndexOrNotePath: "default" | string | number,
    taskDescription: string,
    dueDate: string,
    taskDetails: string,
    tags?: string,
  ) {
    let path: string;
    let str: string;

    if (customNoteIndexOrNotePath === "default") {
      path = this.settings.defaultNote;

      // Merge default tag with user-provided tags
      const allTags = [this.settings.defaultTag, tags]
        .filter(Boolean)
        .join(" ");

      str =
        this.compileLine(
          allTags || undefined,
          taskDescription,
          dueDate,
          taskDetails,
        ) + "\n";
    } else if (typeof customNoteIndexOrNotePath === "string") {
      path = customNoteIndexOrNotePath;

      str =
        this.compileLine(
          tags || undefined,
          taskDescription,
          dueDate,
          taskDetails,
        ) + "\n";
    } else {
      const customNote = this.settings.customNotes[customNoteIndexOrNotePath];

      path = customNote.path;

      // Merge custom note tag with user-provided tags
      const allTags = [customNote.tag, tags].filter(Boolean).join(" ");

      str =
        this.compileLine(
          allTags || undefined,
          taskDescription,
          dueDate,
          taskDetails,
        ) + "\n";
    }

    let file: TFile;
    try {
      file = await this.getFile(path);
    } catch (error) {
      new Notice("Create Task: Note not found");
      return;
    }

    await this.app.vault.append(file, str);

    new Notice("Create Task: Task created");
  }

  compileLine(
    tag: string | undefined,
    taskDescription: string,
    dueDate: string,
    taskDetails: string,
  ) {
    let str = `- [ ]`;

    if (tag) {
      // Split tags by space and add # to each
      const tags = tag.split(/\s+/).filter(Boolean);
      if (tags.length > 0) {
        str += ` #${tags.join(" #")}`;
      }
    }

    if (taskDescription) {
      str += ` ${taskDescription}`;
    } else {
      str += ` My task`;
    }

    // Add created date
    const now = new Date();
    const createdMonth = (now.getMonth() + 1).toString();
    const createdDay = now.getDate().toString();
    const createdDateString = `${now.getFullYear()}-${createdMonth.length === 1 ? "0" + createdMonth : createdMonth}-${createdDay.length === 1 ? "0" + createdDay : createdDay}`;
    str += ` ➕ ${createdDateString}`;

    if (dueDate) {
      const parsedDate = parseDate(dueDate, undefined, {
        forwardDate: true,
      });

      if (parsedDate) {
        const format = this.settings.dateFormat || "@due(YYYY-MM-DD)";
        const month = (parsedDate.getMonth() + 1).toString();
        const day = parsedDate.getDate().toString();
        const dateString = `${parsedDate.getFullYear()}-${month.length === 1 ? "0" + month : month}-${day.length === 1 ? "0" + day : day}`;
        str += ` ${format.replace("YYYY-MM-DD", dateString)}`;
      }
    }

    if (taskDetails) {
      str += `\n\t- ${taskDetails.replace(/\n/g, "\n\t- ")}`;
    }

    return str;
  }

  async getFile(path: string) {
    const file = this.app.vault.getAbstractFileByPath(path);

    if (!file || !(file instanceof TFile)) throw new Error("File not found");

    return file;
  }

  async firstOnboarding() {
    if (this.settings.firstOnboarding) return;

    this.settings.firstOnboarding = new Date();
    await this.saveSettings(true);

    if (this.settings.defaultNote) return;

    this.openOnboardingModal();
  }
}
