"use client";

import React from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import { Chart } from "react-google-charts";
import { generateGanttExcel } from "../utils/excelGenerator";

// Define the TaskData interface as used in other components
interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
}

interface GoogleGanttChartProps {
  tasks: TaskData[];
}

const GoogleGanttChart: React.FC<GoogleGanttChartProps> = ({ tasks }) => {
  // Transform the tasks into the format expected by Google Charts
  const data = [
    [
      { type: "string", label: "Task ID" },
      { type: "string", label: "Task Name" },
      { type: "date", label: "Start Date" },
      { type: "date", label: "End Date" },
      { type: "number", label: "Duration" },
      { type: "number", label: "Percent Complete" },
      { type: "string", label: "Dependencies" },
    ],
    // Map the tasks to Google Charts format
    ...tasks.map((task) => [
      task.id,
      task.name,
      task.start,
      task.end,
      null, // Duration (calculated automatically)
      0, // Percent complete (default to 0)
      null, // Dependencies (none by default)
    ]),
  ];

  const handleExportExcel = async () => {
    if (tasks.length === 0) {
      console.warn("No tasks available to export.");
      return;
    }
    
    try {
      await generateGanttExcel(tasks, "gantt_chart.xlsx");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  // Calculate height based on number of tasks (minimum 450px)
  const taskCount = tasks.length;
  const dynamicHeight = Math.max(450, taskCount * 50);

  const options = {
    height: dynamicHeight,
    gantt: {
      trackHeight: 30,
      criticalPathEnabled: false,
      defaultStartDate: tasks.length > 0 ? tasks[0].start : new Date(),
      barCornerRadius: 3,
      arrow: {
        angle: 100,
        width: 2,
        color: "#5e97f6",
        radius: 0,
      },
    },
  };

  return (
    <Paper elevation={3} sx={{ p: 4, overflow: "hidden" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Gantt Chart (Google Charts)
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleExportExcel}
          disabled={tasks.length === 0}
        >
          Excel&apos;e Aktar
        </Button>
      </Box>
      <Box
        sx={{
          height: 500,
          width: "100%",
          overflow: "auto",
        }}
      >
        {tasks.length > 0 ? (
          <Chart
            chartType="Gantt"
            width="100%"
            height="100%"
            data={data}
            options={options}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "text.secondary",
            }}
          >
            <Typography>No data to display</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default GoogleGanttChart;
