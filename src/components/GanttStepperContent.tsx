import React from "react";
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
  onFileUpload,
  onColumnSelect,
  onConfirm,
  onChartChange,
}) => {
  return (
    <>
      {activeStep === 0 && <FileUploader onFileUpload={onFileUpload} />}
      
      {activeStep === 1 && (
        <ColumnSelector
          columns={columns}
          selectedColumns={selectedColumns}
          onColumnSelect={onColumnSelect}
          onConfirm={onConfirm}
        />
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
