"use client";

import React, { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import FileUploader from "../components/FileUploader";
import ColumnSelector from "../components/ColumnSelector";
import GanttChart from "../components/GanttChart";
import * as XLSX from "xlsx";
import { Task } from "gantt-task-react";

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState({
    description: "",
    startDate: "",
    endDate: "",
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  const steps = [
    "Excel Dosyasını Yükle",
    "Sütunları Seç",
    "Gantt Tablosunu Görüntüle",
  ];

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
          unknown // Use unknown instead of any
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

            setActiveStep(1);
          }
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Excel dosyası işlenirken bir hata oluştu.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleColumnSelect = (
    type: "description" | "startDate" | "endDate",
    column: string,
  ) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [type]: column,
    }));
  };

  const generateGanttChart = () => {
    if (!excelData.length) return;

    const { description, startDate, endDate } = selectedColumns;

    const ganttTasks: Task[] = excelData.map((row, index) => {
      // Extract values from selected columns
      const name = String(row[description] || `Task ${index + 1}`);
      let start: Date;
      let end: Date;

      // Handle date parsing
      const startValue = row[startDate] as string | number | Date; // Add type assertion
      const endValue = row[endDate] as string | number | Date; // Add type assertion

      // Check if the excel library already parsed these as dates
      if (startValue instanceof Date && endValue instanceof Date) {
        start = startValue;
        end = endValue;
      } else {
        // Try to parse as dates
        start = new Date(startValue);
        end = new Date(endValue);

        // If parsing fails or dates are invalid, use fallbacks
        if (isNaN(start.getTime())) start = new Date();
        if (isNaN(end.getTime())) end = new Date(start.getTime() + 86400000); // start + 1 day
      }

      // Ensure end date is after start date
      if (end < start) end = new Date(start.getTime() + 86400000);

      return {
        id: `${index}`,
        name,
        start,
        end,
        progress: 0,
        type: "task",
        isDisabled: false,
        styles: { progressColor: "#0077B6", progressSelectedColor: "#00B4D8" },
      };
    });

    setTasks(ganttTasks);
    setActiveStep(2);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Excel&apos;den Gantt Tablosu
        </Typography>

        <Typography paragraph>
          Excel dosyanızı yükleyin, sütunları seçin ve Gantt tablosunu
          görüntüleyin.
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && <FileUploader onFileUpload={handleFileUpload} />}

        {activeStep === 1 && (
          <ColumnSelector
            columns={columns}
            selectedColumns={selectedColumns}
            onColumnSelect={handleColumnSelect}
            onConfirm={generateGanttChart}
          />
        )}

        {activeStep === 2 && <GanttChart tasks={tasks} />}
      </Paper>
    </Container>
  );
}
