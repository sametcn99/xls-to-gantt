export interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
}

export interface SelectedColumns {
  description: string;
  startDate: string;
  endDate: string;
}

export type ChartType = "mermaid" | "gantt-task-react" | "google-charts";
