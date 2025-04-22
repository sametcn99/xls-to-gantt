import React from "react";
import { CircularProgress, Alert, Box } from "@mui/material";
import FileUploader from "./FileUploader";
import ColumnSelector from "./ColumnSelector";
import ChartSelector from "./ChartSelector";
import GanttChart from "./GanttChart";
import GanttTaskReact from "./GanttTaskReact";
import GoogleGanttChart from "./GoogleGanttChart";
import { SelectedColumns, TaskData, ChartType } from "../types/gantt";

interface GanttStepperContentProps {
  activeStep: number;
  columns: string[];
  selectedColumns: SelectedColumns;
  tasks: TaskData[];
  chartType: ChartType;
  isProcessing?: boolean;
  processingError?: string | null;
  onFileUpload: (file: File) => void;
  onColumnSelect: (type: keyof SelectedColumns, column: string) => void;
  onConfirm: () => void;
  onChartChange: (type: ChartType) => void;
}

const GanttStepperContent: React.FC<GanttStepperContentProps> = ({
  activeStep,
  columns,
  selectedColumns,
  tasks,
  chartType,
  isProcessing = false,
  processingError = null,
  onFileUpload,
  onColumnSelect,
  onConfirm,
  onChartChange,
}) => {
  return (
    <>
      {activeStep === 0 && <FileUploader onFileUpload={onFileUpload} />}
      
      {activeStep === 1 && (
        <>
          {isProcessing ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              py={4}
            >
              <CircularProgress />
              <Box mt={2}>Standardizing date formats with Gemini AI...</Box>
            </Box>
          ) : (
            <ColumnSelector
              columns={columns}
              selectedColumns={selectedColumns}
              onColumnSelect={onColumnSelect}
              onConfirm={onConfirm}
            />
          )}
          
          {processingError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {processingError}
            </Alert>
          )}
        </>
      )}
      
      {activeStep === 2 && (
        <>
          <ChartSelector
            selectedChart={chartType}
            onChartChange={onChartChange}
          />

          {chartType === "mermaid" && <GanttChart tasks={tasks} />}
          {chartType === "gantt-task-react" && <GanttTaskReact tasks={tasks} />}
          {chartType === "google-charts" && <GoogleGanttChart tasks={tasks} />}
        </>
      )}
    </>
  );
};

export default GanttStepperContent;
