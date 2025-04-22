"use client";

import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

// Define the TaskData interface as used in other components
interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
}

interface GanttTaskReactProps {
  tasks: TaskData[];
}

const GanttTaskReact: React.FC<GanttTaskReactProps> = ({ tasks }) => {
  // Transform the tasks into the format expected by gantt-task-react
  const transformedTasks: Task[] = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    start: task.start,
    end: task.end,
    progress: 0, // Default progress to 0
    type: "task",
    isDisabled: false,
    styles: { progressColor: "#0099ff", progressSelectedColor: "#0077cc" },
  }));

  return (
    <Paper elevation={3} sx={{ p: 4, overflow: "hidden" }}>
      <Typography variant="h6" gutterBottom>
        Gantt Chart (gantt-task-react)
      </Typography>
      <Box
        sx={{
          height: 500,
          width: "100%",
          overflow: "auto",
        }}
      >
        {tasks.length > 0 ? (
          <Gantt
            tasks={transformedTasks}
            viewMode={ViewMode.Day}
            listCellWidth="100px"
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

export default GanttTaskReact;
