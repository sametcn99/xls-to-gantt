import { useState } from "react";
import * as XLSX from "xlsx";
import { standardizeDatesWithGemini } from "../utils/geminiApi";

export const useExcelProcessor = () => {
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumns>({
    description: "",
    startDate: "",
    endDate: "",
  });
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
          string,
          unknown
        >[];

        if (jsonData.length > 0) {
          setExcelData(jsonData);

          // Extract column names from the first row
          const firstRow = jsonData[0];
          if (firstRow && typeof firstRow === "object") {
            const columnNames = Object.keys(firstRow);
            setColumns(columnNames);

            // Try to automatically detect possible date and description columns
            const possibleDescCols = columnNames.filter(
              (col) =>
                col.toLowerCase().includes("desc") ||
                col.toLowerCase().includes("task") ||
                col.toLowerCase().includes("activity"),
            );

            const possibleStartDateCols = columnNames.filter(
              (col) =>
                col.toLowerCase().includes("start") ||
                col.toLowerCase().includes("begin"),
            );

            const possibleEndDateCols = columnNames.filter(
              (col) =>
                col.toLowerCase().includes("end") ||
                col.toLowerCase().includes("finish"),
            );

            // Pre-select columns if they can be detected
            setSelectedColumns({
              description: possibleDescCols[0] || "",
              startDate: possibleStartDateCols[0] || "",
              endDate: possibleEndDateCols[0] || "",
            });

            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("An error occurred while processing the Excel file.");
        return false;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleColumnSelect = (type: keyof SelectedColumns, column: string) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [type]: column,
    }));
  };

  const generateGanttChart = async () => {
    if (!excelData.length) return false;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const { description, startDate, endDate } = selectedColumns;

      // Extract all start date and end date values from the data
      // and cast to appropriate types for Gemini API
      const startDateValues = excelData.map((row) => {
        const value = row[startDate];
        return value as string | number | Date;
      });

      const endDateValues = excelData.map((row) => {
        const value = row[endDate];
        return value as string | number | Date;
      });

      // Use Gemini API to standardize the dates
      const standardizedStartDates =
        await standardizeDatesWithGemini(startDateValues);
      const standardizedEndDates =
        await standardizeDatesWithGemini(endDateValues);

      // Create tasks with standardized dates
      const ganttTasks: TaskData[] = excelData.map((row, index) => {
        // Extract values from selected columns
        const name = String(row[description] || `Task ${index + 1}`);
        let start: Date;
        let end: Date;

        // Use standardized dates from Gemini API
        const standardizedStart = standardizedStartDates[index];
        const standardizedEnd = standardizedEndDates[index];

        // Parse the standardized dates
        if (standardizedStart !== "invalid" && standardizedEnd !== "invalid") {
          start = new Date(standardizedStart);
          end = new Date(standardizedEnd);
        } else {
          // Fallback to original logic if Gemini couldn't standardize
          const startValue = row[startDate] as string | number | Date;
          const endValue = row[endDate] as string | number | Date;

          // Check if the excel library already parsed these as dates
          if (startValue instanceof Date && endValue instanceof Date) {
            start = startValue;
            end = endValue;
          } else {
            // Try to parse as dates
            start = new Date(startValue);
            end = new Date(endValue);
          }
        }

        // If parsing fails or dates are invalid, use fallbacks
        if (isNaN(start.getTime())) start = new Date();
        if (isNaN(end.getTime())) end = new Date(start.getTime() + 86400000); // start + 1 day

        // Ensure end date is after start date
        if (end < start) end = new Date(start.getTime() + 86400000);

        // Return object matching the TaskData interface
        return {
          id: `${index}`, // Mermaid needs an ID
          name, // Task name/description
          start, // Start date
          end, // End date
        };
      });

      setTasks(ganttTasks);
      setIsProcessing(false);
      return true;
    } catch (error) {
      console.error("Error generating Gantt chart with Gemini:", error);
      setProcessingError(
        "An error occurred while standardizing dates with Gemini API.",
      );
      setIsProcessing(false);
      return false;
    }
  };

  return {
    excelData,
    columns,
    selectedColumns,
    tasks,
    isProcessing,
    processingError,
    handleFileUpload,
    handleColumnSelect,
    generateGanttChart,
  };
};
