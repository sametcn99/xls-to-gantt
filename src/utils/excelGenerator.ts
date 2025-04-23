import ExcelJS, {
  Column,
  Workbook,
  Worksheet,
  Cell,
  BorderStyle,
  Alignment,
  Borders,
  Style,
  CellValue,
} from "exceljs";
import { saveAs } from "file-saver";

// Define TaskData interface if it's not imported from elsewhere
interface TaskData {
  id: string | number;
  name: string;
  start: Date;
  end: Date;
  // Add other relevant properties if they exist, e.g., category
}

// Define a type for the timeline column definition
interface TimelineColumn extends Partial<Column> {
  header: string;
  key: string;
  width: number;
  style?: Partial<Style> & {
    alignment?: Partial<Alignment> & {
      horizontal?: Alignment["horizontal"];
    };
  };
}

// Define a specific type for basic columns
interface BasicColumn extends Partial<Column> {
  header: string; // Ensure header is always a string
  key: string;
  width: number;
  style?: Partial<Style> & { numFmt?: string };
}

class GanttExcelGenerator {
  private tasks: TaskData[];
  private projectName: string;
  private companyName: string;
  private fileName: string;
  private workbook: Workbook;
  private worksheet: Worksheet;
  private today: Date;
  private todayString: string;
  private minDate!: Date; // Definite assignment assertion
  private maxDate!: Date; // Definite assignment assertion
  private timelineColumns: TimelineColumn[] = [];
  private dateMap: { [key: string]: number } = {};
  private basicColumns: BasicColumn[]; // Use the specific type
  private ganttStartIndex: number;
  private readonly dataStartRow = 6;

  constructor(
    tasks: TaskData[],
    projectName: string = "Project Name",
    companyName: string = "Company Name",
    fileName: string = "gantt_chart.xlsx",
  ) {
    this.tasks = tasks;
    this.projectName = projectName;
    this.companyName = companyName;
    this.fileName = fileName;
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet("Gantt Chart", {
      views: [{ state: "frozen", xSplit: 2, ySplit: 5 }],
      properties: { tabColor: { argb: "FF1A73E8" } },
    });
    this.today = new Date();
    this.todayString = this.today.toISOString().split("T")[0];

    this.basicColumns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Task Name", key: "name", width: 35 },
      {
        header: "Start",
        key: "start",
        width: 12,
        style: { numFmt: "yyyy-mm-dd" },
      },
      { header: "End", key: "end", width: 12, style: { numFmt: "yyyy-mm-dd" } },
      { header: "Duration", key: "duration", width: 10 },
    ];
    this.ganttStartIndex = this.basicColumns.length + 1;

    this.initializeWorkbookProperties();
  }

  private initializeWorkbookProperties(): void {
    this.workbook.creator = "XLS-to-Gantt";
    this.workbook.lastModifiedBy = "XLS-to-Gantt";
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 1,
        visibility: "visible",
      },
    ];
  }

  // --- Helper Methods --- (Moved from standalone functions)
  private diffInDays(date1: Date, date2: Date): number {
    const utc1 = Date.UTC(
      date1.getFullYear(),
      date1.getMonth(),
      date1.getDate(),
    );
    const utc2 = Date.UTC(
      date2.getFullYear(),
      date2.getMonth(),
      date2.getDate(),
    );
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private getDayOfWeek(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getUTCDay()];
  }

  private getTaskColor(task: TaskData): string {
    if (task.end < this.today) return "FF4B9E6A"; // Completed
    if (task.start <= this.today && task.end >= this.today) return "FF1A73E8"; // Current
    return "FF7B61FF"; // Future
  }

  private createBorder(
    style: BorderStyle = "thin",
    color: string = "FFD0D0D0",
  ): Partial<Borders> {
    return {
      top: { style, color: { argb: color } },
      left: { style, color: { argb: color } },
      bottom: { style, color: { argb: color } },
      right: { style, color: { argb: color } },
    };
  }

  private styleCell(
    cell: Cell,
    options: {
      bold?: boolean;
      italic?: boolean;
      size?: number;
      color?: string;
      bgColor?: string;
      hAlign?: Alignment["horizontal"];
      vAlign?: Alignment["vertical"];
      border?: Partial<Borders>;
      wrapText?: boolean;
      numFmt?: string;
    } = {},
  ): void {
    cell.font = {
      bold: options.bold ?? false,
      italic: options.italic ?? false,
      size: options.size ?? 11,
      color: { argb: options.color ?? "FF333333" },
      name: "Calibri",
    };
    cell.alignment = {
      horizontal: options.hAlign ?? "left",
      vertical: options.vAlign ?? "middle",
      wrapText: options.wrapText ?? false,
    };
    if (options.bgColor) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: options.bgColor },
      };
    }
    cell.border = options.border ?? this.createBorder();
    if (options.numFmt) {
      cell.numFmt = options.numFmt;
    }
  }

  // --- Core Logic Methods ---
  private calculateDateRange(): boolean {
    if (this.tasks.length === 0) {
      console.warn("Cannot determine date range with no tasks.");
      return false;
    }

    this.minDate = this.tasks.reduce(
      (min, task) => (task.start < min ? task.start : min),
      this.tasks[0].start,
    );
    this.maxDate = this.tasks.reduce(
      (max, task) => (task.end > max ? task.end : max),
      this.tasks[0].end,
    );

    // Ensure they are Date objects
    this.minDate = new Date(this.minDate);
    this.maxDate = new Date(this.maxDate);

    // Add buffer
    const bufferDays = 5;
    this.minDate = this.addDays(this.minDate, -bufferDays);
    this.maxDate = this.addDays(this.maxDate, bufferDays);
    return true;
  }

  private generateTimelineColumns(): void {
    let currentDate = new Date(this.minDate);
    let colIndex = this.ganttStartIndex;
    this.timelineColumns = []; // Reset
    this.dateMap = {}; // Reset

    while (currentDate <= this.maxDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      const dayOfWeek = this.getDayOfWeek(currentDate);
      this.timelineColumns.push({
        header: `${dayOfWeek}\n${currentDate.getDate()}`,
        key: dateString,
        width: 5,
        style: {
          alignment: { horizontal: "center" as Alignment["horizontal"] },
        },
      });
      this.dateMap[dateString] = colIndex;
      currentDate = this.addDays(currentDate, 1);
      colIndex++;
    }
    this.worksheet.columns = [...this.basicColumns, ...this.timelineColumns];
  }

  private addHeaders(): void {
    // Row 1: Company Name
    this.worksheet.mergeCells(1, 1, 1, this.ganttStartIndex - 1);
    const companyCell = this.worksheet.getCell(1, 1);
    companyCell.value = this.companyName;
    this.styleCell(companyCell, {
      bold: true,
      size: 14,
      color: "FF666666",
      hAlign: "left",
    });
    this.worksheet.getRow(1).height = 25;

    // Row 2: Project Name
    this.worksheet.mergeCells(2, 1, 2, this.ganttStartIndex - 1);
    const projectCell = this.worksheet.getCell(2, 1);
    projectCell.value = this.projectName;
    this.styleCell(projectCell, {
      bold: true,
      size: 16,
      color: "FF1A73E8",
      hAlign: "left",
    });
    this.worksheet.getRow(2).height = 30;

    // Row 3: Generation Date & Task Count
    this.worksheet.mergeCells(3, 1, 3, this.ganttStartIndex - 1);
    const metadataCell = this.worksheet.getCell(3, 1);
    metadataCell.value = `Generated: ${new Date().toLocaleDateString()} | Total Tasks: ${this.tasks.length}`;
    this.styleCell(metadataCell, {
      italic: true,
      size: 9,
      color: "FF888888",
      hAlign: "left",
    });
    this.worksheet.getRow(3).height = 20;

    // Row 4: Spacer Row
    this.worksheet.getRow(4).height = 10;
    for (let i = 1; i < this.ganttStartIndex; i++) {
      this.styleCell(this.worksheet.getCell(3, i), {
        border: { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } },
      });
    }

    // Row 5: Column Headers
    const headerRow = this.worksheet.getRow(5);
    headerRow.height = 40;

    // Style Basic Column Headers
    this.basicColumns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header as CellValue; // Assign header (now guaranteed string) as CellValue
      this.styleCell(cell, {
        bold: true,
        color: "FFFFFFFF",
        bgColor: "FF1A73E8",
        hAlign: "center",
        vAlign: "middle",
        wrapText: true,
      });
    });

    // Style Timeline Column Headers
    this.timelineColumns.forEach((col, index) => {
      const headerCell = headerRow.getCell(this.ganttStartIndex + index);
      headerCell.value = col.header as CellValue; // Assign header (string) as CellValue
      const dateStr = col.key;
      const date = new Date(dateStr + "T00:00:00Z");
      const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const isToday = dateStr === this.todayString;

      this.styleCell(headerCell, {
        bold: true,
        size: 9,
        color: "FFFFFFFF",
        bgColor: isWeekend ? "FF4285F4" : "FF1A73E8",
        hAlign: "center",
        vAlign: "middle",
        wrapText: true,
        border: isToday
          ? this.createBorder("medium", "FFFF0000")
          : this.createBorder("thin", "FFCCCCCC"),
      });
    });
  }

  private addTasksAndGanttBars(): void {
    this.tasks.forEach((task, index) => {
      const duration = this.diffInDays(task.start, task.end) + 1;
      const rowNumber = this.dataStartRow + index;

      const rowData: Record<string, string | number | Date> = {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        duration: duration,
      };
      const row = this.worksheet.addRow(rowData);
      row.height = 20;

      // Style Basic Data Cells
      this.basicColumns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        this.styleCell(cell, {
          hAlign:
            col.key === "id" || col.key === "duration"
              ? "right"
              : col.key === "name"
                ? "left"
                : "center",
          numFmt: col.style?.numFmt,
          bgColor: index % 2 === 1 ? "FFF8F9FA" : undefined,
        });
      });

      // Add Gantt Bars
      const taskStartStr = task.start.toISOString().split("T")[0];
      const taskEndStr = task.end.toISOString().split("T")[0];
      const startColIndex = this.dateMap[taskStartStr];
      const endColIndex = this.dateMap[taskEndStr];

      if (startColIndex !== undefined && endColIndex !== undefined) {
        const actualStartCol = Math.max(startColIndex, this.ganttStartIndex);
        const taskColor = this.getTaskColor(task);

        for (let i = actualStartCol; i <= endColIndex; i++) {
          const cell = this.worksheet.getCell(rowNumber, i);
          if (cell) {
            this.styleCell(cell, {
              bgColor: taskColor,
              border: this.createBorder("thin", "FF888888"),
            });
            if (i === actualStartCol) {
              cell.value = task.id; // Overwrite date cell value with ID
              this.styleCell(cell, {
                bgColor: taskColor,
                border: this.createBorder("thin", "FF888888"),
                color: "FFFFFFFF",
                bold: true,
                size: 8,
                hAlign: "center",
              });
            }
          } else {
            console.warn(
              `Cell at row ${rowNumber}, col ${i} not found for task ${task.id}`,
            );
          }
        }
      } else {
        console.warn(
          `Column index not found for task ${task.id} dates: Start ${taskStartStr}, End ${taskEndStr}`,
        );
      }

      // Style the rest of the timeline cells for this row
      this.timelineColumns.forEach((col, i) => {
        const currentColIndex = this.ganttStartIndex + i;
        if (
          startColIndex === undefined ||
          endColIndex === undefined ||
          currentColIndex < startColIndex ||
          currentColIndex > endColIndex
        ) {
          const cell = this.worksheet.getCell(rowNumber, currentColIndex);
          const dateStr = col.key;
          if (dateStr) {
            const date = new Date(dateStr + "T00:00:00Z");
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            const isTodayCol = dateStr === this.todayString;

            this.styleCell(cell, {
              bgColor: isWeekend
                ? "FFF1F3F4"
                : index % 2 === 1
                  ? "FFF8F9FA"
                  : "FFFFFFFF",
              border: isTodayCol
                ? this.createBorder("medium", "FFFF0000")
                : this.createBorder("thin", "FFD0D0D0"),
            });
          }
        }
      });
    });
  }

  private addLegend(): void {
    const legendStartRow = this.dataStartRow + this.tasks.length + 2;

    this.worksheet.mergeCells(legendStartRow, 1, legendStartRow, 2);
    const legendTitleCell = this.worksheet.getCell(legendStartRow, 1);
    legendTitleCell.value = "Legend";
    this.styleCell(legendTitleCell, { bold: true, size: 12 });

    const legendItems = [
      { text: "Completed Task", color: "FF4B9E6A" },
      { text: "Current Task", color: "FF1A73E8" },
      { text: "Future Task", color: "FF7B61FF" },
      { text: "Weekend", color: "FFF1F3F4" },
    ];

    legendItems.forEach((item, idx) => {
      const row = legendStartRow + idx + 1;
      const colorCell = this.worksheet.getCell(row, 1);
      this.styleCell(colorCell, {
        bgColor: item.color,
        border: this.createBorder("thin", "FF888888"),
      });
      this.worksheet.getColumn(1).width = Math.max(
        this.worksheet.getColumn(1).width ?? 0,
        5,
      );

      const textCell = this.worksheet.getCell(row, 2);
      textCell.value = item.text;
      this.styleCell(textCell, { hAlign: "left" });
      this.worksheet.getColumn(2).width = Math.max(
        this.worksheet.getColumn(2).width ?? 0,
        20,
      );
    });
  }

  private setupAutoFilter(): void {
    this.worksheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5 + this.tasks.length, column: this.basicColumns.length },
    };
  }

  private handleNoTasksCase(): void {
    console.warn("No tasks provided for Excel generation.");
    this.worksheet.columns = this.basicColumns;
    const headerRow = this.worksheet.getRow(5);
    headerRow.height = 40;
    this.basicColumns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header as CellValue; // Assign header (now guaranteed string) as CellValue
      this.styleCell(cell, {
        bold: true,
        color: "FFFFFFFF",
        bgColor: "FF1A73E8",
        hAlign: "center",
        vAlign: "middle",
        wrapText: true,
      });
    });
    this.worksheet.mergeCells(6, 1, 6, this.basicColumns.length);
    const noTaskCell = this.worksheet.getCell(6, 1);
    noTaskCell.value = "No tasks to display.";
    this.styleCell(noTaskCell, {
      hAlign: "center",
      italic: true,
      color: "FF888888",
    });
  }

  // --- Public Method to Generate Excel ---
  public async generate(): Promise<void> {
    if (!this.tasks || this.tasks.length === 0) {
      this.handleNoTasksCase();
    } else {
      if (!this.calculateDateRange()) {
        // Handle case where date range couldn't be calculated (redundant check, but safe)
        this.handleNoTasksCase();
      } else {
        this.generateTimelineColumns();
        this.addHeaders();
        this.addTasksAndGanttBars();
        this.addLegend();
        this.setupAutoFilter();
      }
    }

    // --- Generate and Download File ---
    try {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, this.fileName);
    } catch (error) {
      console.error("Error generating or saving Excel file:", error);
      // Optionally show a user-friendly error message
    }
  }
}

// Export the class and type separately
export { GanttExcelGenerator };
export type { TaskData }; // Use export type for interfaces/types

// Keep the original function signature for backward compatibility or direct use
// It now acts as a simple wrapper around the class
export const generateGanttExcel = async (
  tasks: TaskData[],
  projectName: string = "Project Name",
  companyName: string = "Company Name",
  fileName: string = "gantt_chart.xlsx",
): Promise<void> => {
  const generator = new GanttExcelGenerator(
    tasks,
    projectName,
    companyName,
    fileName,
  );
  await generator.generate();
};
