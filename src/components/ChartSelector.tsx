"use client";

import React from "react";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import BarChartIcon from "@mui/icons-material/BarChart";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";

export type ChartType = "mermaid" | "gantt-task-react" | "google-charts";

interface ChartSelectorProps {
  selectedChart: ChartType;
  onChartChange: (chart: ChartType) => void;
}

const ChartSelector: React.FC<ChartSelectorProps> = ({
  selectedChart,
  onChartChange,
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newChart: ChartType | null,
  ) => {
    // Prevent deselection (always keep one option selected)
    if (newChart !== null) {
      onChartChange(newChart);
    }
  };

  return (
    <ToggleButtonGroup
      value={selectedChart}
      exclusive
      onChange={handleChange}
      aria-label="chart type"
      sx={{ mb: 2, display: "flex", justifyContent: "center" }}
    >
      <ToggleButton value="mermaid" aria-label="mermaid chart">
        <TimelineIcon sx={{ mr: 1 }} />
        Mermaid
      </ToggleButton>
      <ToggleButton value="gantt-task-react" aria-label="gantt-task-react">
        <BarChartIcon sx={{ mr: 1 }} />
        Gantt Task React
      </ToggleButton>
      <ToggleButton value="google-charts" aria-label="google charts">
        <StackedBarChartIcon sx={{ mr: 1 }} />
        Google Charts
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ChartSelector;
