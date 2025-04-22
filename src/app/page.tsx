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
import GanttStepperContent from "../components/GanttStepperContent";
import { useExcelProcessor } from "../hooks/useExcelProcessor";

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [chartType, setChartType] = useState<ChartType>("mermaid");

  const {
    columns,
    selectedColumns,
    tasks,
    isProcessing,
    processingError,
    handleFileUpload,
    handleColumnSelect,
    generateGanttChart,
  } = useExcelProcessor();

  const steps = ["Upload Excel File", "Select Columns", "View Gantt Chart"];

  const handleFileUploaded = (file: File) => {
    handleFileUpload(file);
    setActiveStep(1);
  };

  const handleColumnsConfirmed = async () => {
    // Now handling the async nature of generateGanttChart which uses Gemini API
    const success = await generateGanttChart();
    if (success) {
      setActiveStep(2);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Excel to Gantt Chart
        </Typography>
        <Typography paragraph>
          Upload your Excel file, select the columns, and view the Gantt chart.
          The application uses Gemini AI to standardize date formats.
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <GanttStepperContent
          activeStep={activeStep}
          columns={columns}
          selectedColumns={selectedColumns}
          tasks={tasks}
          chartType={chartType}
          isProcessing={isProcessing}
          processingError={processingError}
          onFileUpload={handleFileUploaded}
          onColumnSelect={handleColumnSelect}
          onConfirm={handleColumnsConfirmed}
          onChartChange={setChartType}
        />
      </Paper>
    </Container>
  );
}
