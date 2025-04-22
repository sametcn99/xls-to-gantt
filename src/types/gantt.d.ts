type TaskData = {
  id: string;
  name: string;
  start: Date;
  end: Date;
};

type SelectedColumns = {
  description: string;
  startDate: string;
  endDate: string;
};

type ChartType = "mermaid" | "gantt-task-react" | "google-charts";
