
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Define the TaskData interface matching the one used elsewhere
interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
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

export const generateGanttExcel = async (tasks: TaskData[], fileName: string = "gantt_chart.xlsx"): Promise<void> => {
  if (!tasks || tasks.length === 0) {
    console.warn("No tasks provided for Excel generation.");
    // Optionally show a user-friendly message here
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Gantt Chart');

  // --- Basic Task Data Columns ---
  const basicColumns = [
    { header: 'Task ID', key: 'id', width: 15 },
    { header: 'Task Name', key: 'name', width: 30 },
    { header: 'Start Date', key: 'start', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'End Date', key: 'end', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'Duration (Days)', key: 'duration', width: 15 },
  ];

  // --- Timeline Columns ---
  // Find the overall date range
  let minDate = tasks.reduce((min, task) => task.start < min ? task.start : min, tasks[0].start);
  let maxDate = tasks.reduce((max, task) => task.end > max ? task.end : max, tasks[0].end);

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
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    timelineColumns.push({ header: dateString, key: dateString, width: 5 }); // Adjust width as needed
    dateMap[dateString] = colIndex;
    currentDate = addDays(currentDate, 1);
    colIndex++;
  }

  worksheet.columns = [...basicColumns, ...timelineColumns];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
   // Rotate timeline headers
   timelineColumns.forEach((col, index) => {
    const headerCell = worksheet.getCell(1, basicColumns.length + 1 + index);
    headerCell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
    // Adjust row height for rotated text if necessary
     worksheet.getRow(1).height = 60;
  });


  // --- Add Task Data and Gantt Bars ---
  tasks.forEach((task, index) => {
    const duration = diffInDays(task.start, task.end) + 1; // Inclusive duration
    const rowNumber = index + 2; // Start from row 2

    // Add basic task data
    worksheet.addRow({
      id: task.id,
      name: task.name,
      start: task.start,
      end: task.end,
      duration: duration,
    });

    // Add Gantt bar using cell fill
    const taskStartStr = task.start.toISOString().split('T')[0];
    const taskEndStr = task.end.toISOString().split('T')[0];

    const startColIndex = dateMap[taskStartStr];
    const endColIndex = dateMap[taskEndStr];


    if (startColIndex !== undefined && endColIndex !== undefined) {
       // Ensure startColIndex is not before the first timeline column
       const actualStartCol = Math.max(startColIndex, basicColumns.length + 1);

      for (let i = actualStartCol; i <= endColIndex; i++) {
        const cell = worksheet.getCell(rowNumber, i);
        if (cell) { // Check if cell exists at this column index
           cell.fill = {
             type: 'pattern',
             pattern: 'solid',
             fgColor: { argb: 'FF4285F4' }, // Google Blue color, adjust as needed
           };
           // Optional: Add borders for clarity
           cell.border = {
             top: { style: 'thin' },
             left: { style: 'thin' },
             bottom: { style: 'thin' },
             right: { style: 'thin' },
           };
        } else {
             console.warn(`Cell at row ${rowNumber}, col ${i} not found for task ${task.id}`);
        }
      }
    } else {
        console.warn(`Could not find column indices for task ${task.id} dates: Start ${taskStartStr}, End ${taskEndStr}`);
        if(startColIndex === undefined) console.warn(`Date ${taskStartStr} not found in dateMap.`);
        if(endColIndex === undefined) console.warn(`Date ${taskEndStr} not found in dateMap.`);
    }
  });

   // Freeze Task Panes for better scrolling
   worksheet.views = [
    { state: 'frozen', xSplit: 2, ySplit: 1, topLeftCell: 'C2' } // Freeze Task ID and Name columns, and Header row
  ];


  // --- Generate and Download File ---
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Error generating or saving Excel file:", error);
    // Optionally show a user-friendly error message
  }
};
