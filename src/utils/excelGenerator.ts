import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Define the TaskData interface matching the one used elsewhere
interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress?: number; // Optional progress percentage
  category?: string; // Optional category for color coding
}

// Helper function to calculate the difference in days between two dates
const diffInDays = (date1: Date, date2: Date): number => {
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// Helper function to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper function to format date as day of week
const getDayOfWeek = (date: Date): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

// Get a professional color for task bars based on category or status
const getTaskColor = (task: TaskData, today: Date): string => {
  // Past tasks (completed)
  if (task.end < today) {
    return "FF4B9E6A"; // Green for completed tasks
  }

  // Current tasks (in progress)
  if (task.start <= today && task.end >= today) {
    return "FF1A73E8"; // Blue for current tasks
  }

  // Future tasks
  return "FF7B61FF"; // Purple for future tasks

  // If category colors needed, could add logic here based on task.category
};

// Helper to create better border styles
const createBorder = (
  style: ExcelJS.BorderStyle = "thin",
): Partial<ExcelJS.Borders> => {
  return {
    top: { style },
    left: { style },
    bottom: { style },
    right: { style },
  };
};

export const generateGanttExcel = async (
  tasks: TaskData[],
  fileName: string = "gantt_chart.xlsx",
): Promise<void> => {
  if (!tasks || tasks.length === 0) {
    console.warn("No tasks provided for Excel generation.");
    // Optionally show a user-friendly message here
    return;
  }

  const workbook = new ExcelJS.Workbook();

  // Set workbook properties for professionalism
  workbook.creator = "XLS-to-Gantt";
  workbook.lastModifiedBy = "XLS-to-Gantt";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Gantt Chart", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 3 }], // Freeze panes after title and header rows
  });

  // Reference date for color coding (today)
  const today = new Date();

  // --- Add Title and Metadata ---
  worksheet.mergeCells("A1:E1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Project Gantt Chart";
  titleCell.font = { bold: true, size: 16, color: { argb: "FF333333" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F3F4" }, // Light gray background
  };
  worksheet.getRow(1).height = 30;

  // Add metadata row
  worksheet.mergeCells("A2:E2");
  const metadataCell = worksheet.getCell("A2");
  metadataCell.value = `Generated: ${new Date().toLocaleString()} | Tasks: ${tasks.length}`;
  metadataCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
  metadataCell.alignment = { horizontal: "center", vertical: "middle" };
  metadataCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" }, // Very light gray background
  };

  // --- Basic Task Data Columns ---
  const basicColumns = [
    { header: "Task ID", key: "id", width: 12 },
    { header: "Task Name", key: "name", width: 40 },
    {
      header: "Start Date",
      key: "start",
      width: 15,
      style: { numFmt: "yyyy-mm-dd" },
    },
    {
      header: "End Date",
      key: "end",
      width: 15,
      style: { numFmt: "yyyy-mm-dd" },
    },
    { header: "Duration (Days)", key: "duration", width: 15 },
  ];

  // --- Timeline Columns ---
  // Find the overall date range
  let minDate = tasks.reduce(
    (min, task) => (task.start < min ? task.start : min),
    tasks[0].start,
  );
  let maxDate = tasks.reduce(
    (max, task) => (task.end > max ? task.end : max),
    tasks[0].end,
  );

  // Ensure minDate is a Date object if initial value wasn't overwritten
  minDate = new Date(minDate);
  maxDate = new Date(maxDate);

  const timelineColumns = [];
  const dateMap: { [key: string]: number } = {}; // Map date string to column index
  let currentDate = new Date(minDate);
  let colIndex = basicColumns.length + 1; // Start after basic columns

  // Add a buffer of days before and after
  const bufferDays = 3;
  minDate = addDays(minDate, -bufferDays);
  maxDate = addDays(maxDate, bufferDays);
  currentDate = new Date(minDate); // Reset current date

  while (currentDate <= maxDate) {
    const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    const dayOfWeek = getDayOfWeek(currentDate);
    timelineColumns.push({
      header: `${dateString}\n${dayOfWeek}`,
      key: dateString,
      width: 5.5, // Slightly wider to accommodate the day name
    });
    dateMap[dateString] = colIndex;
    currentDate = addDays(currentDate, 1);
    colIndex++;
  }

  // Set columns with the appropriate start row (row 3 after title and metadata)
  worksheet.columns = [...basicColumns, ...timelineColumns];

  // --- Style Header Row (now row 3 after title and metadata) ---
  const headerRow = worksheet.getRow(3);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  headerRow.height = 60;

  // Apply background colors to all headers
  for (let i = 1; i <= basicColumns.length; i++) {
    const cell = headerRow.getCell(i);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A73E8" }, // Google blue for headers
    };
    cell.border = createBorder("thin");
  }

  // Rotate and style timeline headers
  timelineColumns.forEach((col, index) => {
    const headerCell = worksheet.getCell(3, basicColumns.length + 1 + index);
    headerCell.alignment = {
      textRotation: 90,
      vertical: "middle",
      horizontal: "center",
    };

    // Weekend highlighting
    const dateStr = col.header.split("\n")[0];
    const date = new Date(dateStr);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isWeekend ? "FF4285F4" : "FF1A73E8" }, // Darker blue for weekends
    };
    headerCell.border = createBorder("thin");
  });

  // --- Add Task Data and Gantt Bars ---
  tasks.forEach((task, index) => {
    const duration = diffInDays(task.start, task.end) + 1; // Inclusive duration
    const rowNumber = index + 4; // Start from row 4 (after title, metadata, header)

    // Add basic task data
    const row = worksheet.addRow({
      id: task.id,
      name: task.name,
      start: task.start,
      end: task.end,
      duration: duration,
    });

    // Alternate row colors for better readability
    if (index % 2 === 1) {
      for (let i = 1; i <= basicColumns.length; i++) {
        row.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" }, // Very light gray for alternating rows
        };
      }
    }

    // Style task data cells
    for (let i = 1; i <= basicColumns.length; i++) {
      const cell = row.getCell(i);
      cell.border = createBorder("thin");

      // Align numbers to right, text to left
      if (i === 1 || i === 5) {
        // ID and Duration columns
        cell.alignment = { horizontal: "right" };
      } else if (i === 2) {
        // Name column
        cell.alignment = { horizontal: "left" };
      } else {
        // Date columns
        cell.alignment = { horizontal: "center" };
      }
    }

    // Add Gantt bar using cell fill with enhanced styling
    const taskStartStr = task.start.toISOString().split("T")[0];
    const taskEndStr = task.end.toISOString().split("T")[0];

    const startColIndex = dateMap[taskStartStr];
    const endColIndex = dateMap[taskEndStr];

    if (startColIndex !== undefined && endColIndex !== undefined) {
      // Ensure startColIndex is not before the first timeline column
      const actualStartCol = Math.max(startColIndex, basicColumns.length + 1);
      const taskColor = getTaskColor(task, today);

      for (let i = actualStartCol; i <= endColIndex; i++) {
        const cell = worksheet.getCell(rowNumber, i);
        if (cell) {
          // Apply appropriate styling for task bars
          // First and last cells get special treatment for rounded corners
          if (i === actualStartCol && i === endColIndex) {
            // Single-cell task (start and end same day)
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: taskColor },
            };
          } else if (i === actualStartCol) {
            // First cell in the task
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: taskColor },
            };
          } else if (i === endColIndex) {
            // Last cell in the task
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: taskColor },
            };
          } else {
            // Middle cells
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: taskColor },
            };
          }

          // Add borders for clarity - thicker border for task outline
          cell.border = createBorder("thin");

          // Add task ID as text in first cell for clarity
          if (i === actualStartCol) {
            cell.value = task.id;
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 8 };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        } else {
          console.warn(
            `Cell at row ${rowNumber}, col ${i} not found for task ${task.id}`,
          );
        }
      }
    } else {
      console.warn(
        `Could not find column indices for task ${task.id} dates: Start ${taskStartStr}, End ${taskEndStr}`,
      );
      if (startColIndex === undefined)
        console.warn(`Date ${taskStartStr} not found in dateMap.`);
      if (endColIndex === undefined)
        console.warn(`Date ${taskEndStr} not found in dateMap.`);
    }
  });

  // --- Add Legend ---
  const legendRowStart = tasks.length + 5; // Start legend after tasks with some space

  worksheet.mergeCells(`A${legendRowStart}:E${legendRowStart}`);
  const legendTitleCell = worksheet.getCell(`A${legendRowStart}`);
  legendTitleCell.value = "Legend";
  legendTitleCell.font = { bold: true, size: 12 };
  legendTitleCell.alignment = { horizontal: "left" };

  // Add legend items
  const legendItems = [
    { text: "Completed Tasks", color: "FF4B9E6A" },
    { text: "Current Tasks", color: "FF1A73E8" },
    { text: "Future Tasks", color: "FF7B61FF" },
  ];

  legendItems.forEach((item, idx) => {
    const row = legendRowStart + idx + 1;

    // Color sample
    const colorCell = worksheet.getCell(`A${row}`);
    colorCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: item.color },
    };
    colorCell.border = createBorder("thin");

    // Description
    worksheet.mergeCells(`B${row}:E${row}`);
    const textCell = worksheet.getCell(`B${row}`);
    textCell.value = item.text;
    textCell.alignment = { horizontal: "left", vertical: "middle" };
  });

  // Auto-filter for data
  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: tasks.length + 3, column: basicColumns.length },
  };

  // --- Generate and Download File ---
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error generating or saving Excel file:", error);
    // Optionally show a user-friendly error message
  }
};
