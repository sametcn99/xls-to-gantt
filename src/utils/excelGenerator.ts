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
  // Start data rows from row 2
  private readonly dataStartRow = 2;
  // Header row is now row 1
  private readonly headerRowNumber = 1;

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

    // Initialize basicColumns *before* using it in worksheet options
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

    this.worksheet = this.workbook.addWorksheet("Gantt Chart", {
      // Freeze panes below header row (1) and after basic columns
      // Now basicColumns is defined
      views: [
        {
          state: "frozen",
          xSplit: this.basicColumns.length,
          ySplit: this.headerRowNumber,
        },
      ], // Use headerRowNumber (1)
      properties: { tabColor: { argb: "FF1A73E8" } },
    });
    this.today = new Date();
    // ...existing code...
    this.todayString = this.today.toISOString().split("T")[0];

    // basicColumns assignment moved up

    // Adjust freeze pane after basicColumns are defined (already done in worksheet creation)
    // this.worksheet.views = [{ state: "frozen", xSplit: this.basicColumns.length, ySplit: this.headerRowNumber }];

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
    // Set freeze pane here after basicColumns is initialized
    this.worksheet.views = [
      {
        state: "frozen",
        xSplit: this.basicColumns.length,
        ySplit: this.headerRowNumber,
      },
    ]; // Use headerRowNumber (1)
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
    // Ensure dates are compared correctly
    const todayStart = new Date(this.today.setHours(0, 0, 0, 0));
    const taskStart = new Date(task.start.setHours(0, 0, 0, 0));
    const taskEnd = new Date(task.end.setHours(0, 0, 0, 0));

    if (taskEnd < todayStart) return "FF4B9E6A"; // Completed (ends before today)
    if (taskStart <= todayStart && taskEnd >= todayStart) return "FF1A73E8"; // Current (includes today)
    return "FF7B61FF"; // Future (starts after today)
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
    // Ensure border is applied correctly, even if default
    cell.border = options.border ?? this.createBorder();
    if (options.numFmt) {
      cell.numFmt = options.numFmt;
    }
  }

  // --- Core Logic Methods ---
  private calculateDateRange(): boolean {
    if (this.tasks.length === 0) {
      console.warn("Cannot determine date range with no tasks.");
      // Set default range if no tasks
      this.minDate = this.addDays(this.today, -7);
      this.maxDate = this.addDays(this.today, 14);
      return true; // Allow proceeding to generate headers etc.
    }

    // Ensure start and end are Date objects before comparison
    const validTasks = this.tasks.filter(
      (task) => task.start instanceof Date && task.end instanceof Date,
    );

    if (validTasks.length === 0) {
      console.warn("No tasks with valid Date objects found.");
      this.minDate = this.addDays(this.today, -7);
      this.maxDate = this.addDays(this.today, 14);
      return true;
    }

    this.minDate = validTasks.reduce(
      (min, task) => (task.start < min ? task.start : min),
      validTasks[0].start,
    );
    this.maxDate = validTasks.reduce(
      (max, task) => (task.end > max ? task.end : max),
      validTasks[0].end,
    );

    // Ensure they are Date objects (might be redundant now but safe)
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
          alignment: {
            horizontal: "center" as Alignment["horizontal"],
            wrapText: true,
            vertical: "middle",
          }, // Ensure wrapText and vertical alignment
        },
      });
      this.dateMap[dateString] = colIndex;
      currentDate = this.addDays(currentDate, 1);
      colIndex++;
    }
    // Set columns *after* timeline columns are generated
    this.worksheet.columns = [...this.basicColumns, ...this.timelineColumns];
  }

  private addHeaders(): void {
    // Headers start at headerRowNumber (1)
    const headerRow = this.worksheet.getRow(this.headerRowNumber);
    headerRow.height = 40; // Keep header height

    // Style Basic Column Headers
    this.basicColumns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header as CellValue;
      this.styleCell(cell, {
        bold: true,
        color: "FFFFFFFF",
        bgColor: "FF1A73E8",
        hAlign: "center",
        vAlign: "middle",
        wrapText: true,
        border: this.createBorder("thin", "FFCCCCCC"), // Add border to headers
      });
    });

    // Style Timeline Column Headers
    this.timelineColumns.forEach((col, index) => {
      const headerCell = headerRow.getCell(this.ganttStartIndex + index);
      headerCell.value = col.header as CellValue;
      const dateStr = col.key;
      // Add defensive check for dateStr
      if (dateStr) {
        try {
          const date = new Date(dateStr + "T00:00:00Z"); // Use UTC to avoid timezone issues
          const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
          const isToday = dateStr === this.todayString;

          this.styleCell(headerCell, {
            bold: true,
            size: 9,
            color: "FFFFFFFF",
            bgColor: isWeekend ? "FF4285F4" : "FF1A73E8", // Lighter blue for weekends
            hAlign: "center",
            vAlign: "middle",
            wrapText: true,
            border: isToday
              ? this.createBorder("medium", "FFFF0000") // Highlight today's border
              : this.createBorder("thin", "FFCCCCCC"),
          });
        } catch (e) {
          console.error(
            `Error processing date string for header: ${dateStr}`,
            e,
          );
          this.styleCell(headerCell, {
            // Basic styling if date fails
            bold: true,
            size: 9,
            color: "FFFFFFFF",
            bgColor: "FF1A73E8",
            hAlign: "center",
            vAlign: "middle",
            wrapText: true,
            border: this.createBorder("thin", "FFCCCCCC"),
          });
        }
      } else {
        console.warn(
          `Missing key (date string) for timeline column at index ${index}`,
        );
        this.styleCell(headerCell, {
          // Basic styling if key is missing
          bold: true,
          size: 9,
          color: "FFFFFFFF",
          bgColor: "FF1A73E8",
          hAlign: "center",
          vAlign: "middle",
          wrapText: true,
          border: this.createBorder("thin", "FFCCCCCC"),
        });
      }
    });
  }

  private addTasksAndGanttBars(): void {
    if (this.tasks.length === 0) return; // Don't add tasks if none exist

    this.tasks.forEach((task, index) => {
      // Ensure start and end are valid dates
      if (
        !(task.start instanceof Date) ||
        !(task.end instanceof Date) ||
        isNaN(task.start.getTime()) ||
        isNaN(task.end.getTime())
      ) {
        console.warn(`Skipping task with invalid dates: ID ${task.id}`);
        return;
      }

      // Ensure start is not after end
      if (task.start > task.end) {
        console.warn(
          `Skipping task where start date is after end date: ID ${task.id}`,
        );
        return; // Or swap dates if that's the desired behavior
      }

      const duration = this.diffInDays(task.start, task.end) + 1;
      // Calculate row number based on the new dataStartRow (2)
      const rowNumber = this.dataStartRow + index;

      const rowData: Record<string, string | number | Date> = {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        duration: duration,
      };

      // Add row using specific columns to avoid issues with extra keys
      const rowValues = this.basicColumns.map((col) => rowData[col.key]);
      const row = this.worksheet.addRow(rowValues); // Add row with only basic data first
      row.height = 20;

      // Style Basic Data Cells
      this.basicColumns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        // Apply basic styling first
        this.styleCell(cell, {
          hAlign:
            col.key === "id" || col.key === "duration"
              ? "right"
              : col.key === "name"
                ? "left"
                : "center",
          numFmt: col.style?.numFmt,
          bgColor: index % 2 === 1 ? "FFF8F9FA" : undefined, // Alternate row color
          border: this.createBorder("thin", "FFD0D0D0"), // Ensure all cells have borders
        });
        // Set value explicitly if needed (addRow might handle it, but this is safer)
        if (col.key === "start" || col.key === "end") {
          cell.value = rowData[col.key] as Date; // Ensure Date type for date columns
        } else {
          cell.value = rowData[col.key] as CellValue;
        }
      });

      // Add Gantt Bars
      const taskStartStr = task.start.toISOString().split("T")[0];
      const taskEndStr = task.end.toISOString().split("T")[0];
      const startColIndex = this.dateMap[taskStartStr];
      const endColIndex = this.dateMap[taskEndStr];

      if (startColIndex !== undefined && endColIndex !== undefined) {
        // Ensure startCol is not before the Gantt area begins
        const actualStartCol = Math.max(startColIndex, this.ganttStartIndex);
        // Ensure endCol is not before actualStartCol
        const actualEndCol = Math.max(endColIndex, actualStartCol);

        const taskColor = this.getTaskColor(task);

        for (let i = actualStartCol; i <= actualEndCol; i++) {
          // Use getCell which creates the cell if it doesn't exist
          const cell = this.worksheet.getCell(rowNumber, i);
          this.styleCell(cell, {
            bgColor: taskColor,
            border: this.createBorder("thin", "FF888888"), // Darker border for task bars
          });
          // Optionally add task ID/name to the first cell of the bar
          // if (i === actualStartCol) {
          //   cell.value = task.id; // Example: Show ID
          //   this.styleCell(cell, { /* existing styles */ color: 'FFFFFFFF', bold: true, size: 8, hAlign: 'center' });
          // }
        }
      } else {
        console.warn(
          `Column index not found for task ${task.id} dates: Start ${taskStartStr}, End ${taskEndStr}. Map keys: ${Object.keys(this.dateMap).join(", ")}`,
        );
      }

      // Style the rest of the timeline cells for this row (non-task bar cells)
      this.timelineColumns.forEach((col, i) => {
        const currentColIndex = this.ganttStartIndex + i;
        // Check if the current cell is *outside* the task bar range
        if (
          startColIndex === undefined ||
          endColIndex === undefined ||
          currentColIndex < Math.max(startColIndex, this.ganttStartIndex) || // Before task starts (considering gantt area)
          currentColIndex > Math.max(endColIndex, this.ganttStartIndex) // After task ends (considering gantt area)
        ) {
          const cell = this.worksheet.getCell(rowNumber, currentColIndex);
          const dateStr = col.key;
          if (dateStr) {
            try {
              const date = new Date(dateStr + "T00:00:00Z"); // Use UTC
              const isWeekend =
                date.getUTCDay() === 0 || date.getUTCDay() === 6;
              const isTodayCol = dateStr === this.todayString;

              // Check if the cell already has a task bar style; if so, don't overwrite background
              const existingFill = cell.fill;
              const isTaskBarCell =
                existingFill &&
                existingFill.type === "pattern" &&
                existingFill.pattern === "solid" &&
                existingFill.fgColor?.argb === this.getTaskColor(task); // Check against potential task colors if needed

              if (!isTaskBarCell) {
                this.styleCell(cell, {
                  bgColor: isWeekend
                    ? "FFF1F3F4" // Light grey for weekends
                    : index % 2 === 1
                      ? "FFF8F9FA" // Lighter alternate row color
                      : "FFFFFFFF", // White background
                  border: isTodayCol
                    ? this.createBorder("medium", "FFFF0000") // Highlight today column
                    : this.createBorder("thin", "FFD0D0D0"), // Standard thin border
                });
              } else {
                // If it IS a task bar cell (somehow missed the range check), ensure border is correct
                this.styleCell(cell, {
                  border: isTodayCol
                    ? this.createBorder("medium", "FFFF0000")
                    : this.createBorder("thin", "FF888888"), // Use task bar border color
                });
              }
            } catch (e) {
              console.error(
                `Error processing date string for timeline cell: ${dateStr}`,
                e,
              );
              // Apply default styling if date parsing fails
              this.styleCell(
                this.worksheet.getCell(rowNumber, currentColIndex),
                {
                  bgColor: index % 2 === 1 ? "FFF8F9FA" : "FFFFFFFF",
                  border: this.createBorder("thin", "FFD0D0D0"),
                },
              );
            }
          } else {
            // Apply default styling if date string (key) is missing
            this.styleCell(this.worksheet.getCell(rowNumber, currentColIndex), {
              bgColor: index % 2 === 1 ? "FFF8F9FA" : "FFFFFFFF",
              border: this.createBorder("thin", "FFD0D0D0"),
            });
          }
        }
      });
    });
  }

  private addLegend(): number {
    // Return the last row used by the legend
    // Calculate legend start row based on the new dataStartRow
    const legendStartRow = this.dataStartRow + this.tasks.length + 2; // Add space after tasks

    this.worksheet.mergeCells(legendStartRow, 1, legendStartRow, 2);
    const legendTitleCell = this.worksheet.getCell(legendStartRow, 1);
    legendTitleCell.value = "Legend";
    this.styleCell(legendTitleCell, { bold: true, size: 12 });

    const legendItems = [
      { text: "Completed Task", color: "FF4B9E6A" },
      { text: "Current Task", color: "FF1A73E8" },
      { text: "Future Task", color: "FF7B61FF" },
      { text: "Weekend", color: "FFF1F3F4" }, // Use the actual weekend background color
    ];

    let lastLegendRow = legendStartRow;
    legendItems.forEach((item, idx) => {
      const row = legendStartRow + idx + 1;
      lastLegendRow = row; // Keep track of the last row used

      // Color Swatch Cell (Column 1)
      const colorCell = this.worksheet.getCell(row, 1);
      this.styleCell(colorCell, {
        bgColor: item.color,
        border: this.createBorder("thin", "FF888888"),
      });
      // Ensure column 1 has some width for the swatch
      const col1 = this.worksheet.getColumn(1);
      col1.width = Math.max(col1.width ?? 0, 5);

      // Text Description Cell (Column 2)
      const textCell = this.worksheet.getCell(row, 2);
      textCell.value = item.text;
      // Pass undefined or omit border for no border, instead of "none"
      this.styleCell(textCell, { hAlign: "left", border: undefined }); // No border for text cell usually looks cleaner
      // Ensure column 2 is wide enough for the text
      const col2 = this.worksheet.getColumn(2);
      col2.width = Math.max(col2.width ?? 0, 20); // Adjust width as needed
    });

    return lastLegendRow; // Return the last row number used by the legend
  }

  private addFooterInfo(startRow: number): void {
    const footerRow1 = startRow; // Company Name
    const footerRow2 = startRow + 1; // Project Name
    const footerRow3 = startRow + 2; // Generation Date

    const mergeEndCol =
      this.basicColumns.length > 2 ? 3 : this.basicColumns.length; // Merge across first few basic columns

    // Row 1: Company Name
    this.worksheet.mergeCells(footerRow1, 1, footerRow1, mergeEndCol);
    const companyCell = this.worksheet.getCell(footerRow1, 1);
    companyCell.value = this.companyName;
    this.styleCell(companyCell, {
      bold: true,
      size: 12, // Slightly smaller than original header
      color: "FF666666",
      hAlign: "left",
      border: { top: { style: "thin", color: { argb: "FFCCCCCC" } } }, // Add top border as separator
    });
    this.worksheet.getRow(footerRow1).height = 20;

    // Row 2: Project Name
    this.worksheet.mergeCells(footerRow2, 1, footerRow2, mergeEndCol);
    const projectCell = this.worksheet.getCell(footerRow2, 1);
    projectCell.value = this.projectName;
    this.styleCell(projectCell, {
      bold: true,
      size: 14, // Slightly smaller than original header
      color: "FF1A73E8",
      hAlign: "left",
      border: {}, // No border within footer block
    });
    this.worksheet.getRow(footerRow2).height = 25;

    // Row 3: Generation Date & Task Count
    this.worksheet.mergeCells(footerRow3, 1, footerRow3, mergeEndCol);
    const metadataCell = this.worksheet.getCell(footerRow3, 1);
    metadataCell.value = `Generated: ${new Date().toLocaleDateString()} | Total Tasks: ${this.tasks.length}`;
    this.styleCell(metadataCell, {
      italic: true,
      size: 9,
      color: "FF888888",
      hAlign: "left",
      border: {}, // No border
    });
    this.worksheet.getRow(footerRow3).height = 20;
  }

  private setupAutoFilter(): void {
    // AutoFilter should apply to the header row (1) and data rows below it
    this.worksheet.autoFilter = {
      from: { row: this.headerRowNumber, column: 1 }, // Use headerRowNumber (1)
      // Ensure 'to' row covers all potential tasks, even if 0
      to: {
        row: this.headerRowNumber + Math.max(this.tasks.length, 1),
        column: this.basicColumns.length,
      },
    };
  }

  private handleNoTasksCase(): void {
    console.warn("No tasks provided for Excel generation.");
    // Still generate timeline columns for context if date range is available
    if (this.minDate && this.maxDate) {
      this.generateTimelineColumns(); // Generates columns based on default range
    } else {
      // Fallback if date range failed completely
      this.worksheet.columns = this.basicColumns;
    }

    this.addHeaders(); // Add the main headers (ID, Name, etc.) on row 1

    // Add "No tasks" message below headers (starting at dataStartRow = 2)
    const noTaskRow = this.dataStartRow; // Place message where data would start (row 2)
    this.worksheet.mergeCells(
      noTaskRow,
      1,
      noTaskRow,
      this.basicColumns.length,
    );
    const noTaskCell = this.worksheet.getCell(noTaskRow, 1);
    noTaskCell.value = "No tasks to display.";
    this.styleCell(noTaskCell, {
      hAlign: "center",
      italic: true,
      color: "FF888888",
    });
    this.worksheet.getRow(noTaskRow).height = 30;

    // Add footer info below the "No tasks" message
    const footerStartRow = noTaskRow + 2; // Add some space
    this.addFooterInfo(footerStartRow);
  }

  // --- Public Method to Generate Excel ---
  public async generate(): Promise<void> {
    // 1. Calculate Date Range (determines timeline columns)
    if (!this.calculateDateRange()) {
      console.error("Failed to calculate date range. Aborting generation.");
      // Optionally show a user error message
      return;
    }

    // 2. Generate Timeline Columns (sets worksheet.columns)
    this.generateTimelineColumns();

    // 3. Add Main Headers (Row 5)
    this.addHeaders();

    if (!this.tasks || this.tasks.length === 0) {
      // 4a. Handle No Tasks Case (adds message, calls addFooterInfo)
      this.handleNoTasksCase();
    } else {
      // 4b. Add Task Data and Gantt Bars (Starts at dataStartRow)
      this.addTasksAndGanttBars();

      // 5b. Add Legend (Calculates position based on tasks)
      const lastLegendRow = this.addLegend();

      // 6b. Add Footer Info (Positioned after legend)
      const footerStartRow = lastLegendRow + 2; // Add space after legend
      this.addFooterInfo(footerStartRow);

      // 7b. Setup AutoFilter for the data table
      this.setupAutoFilter();
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
