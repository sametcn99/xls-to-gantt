"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import mermaid from "mermaid";

// Define a Task interface suitable for Mermaid Gantt
interface TaskData {
  id: string;
  name: string;
  start: Date;
  end: Date;
  // Add other relevant fields if needed, e.g., dependencies
}

interface GanttChartProps {
  tasks: TaskData[];
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    // Initialize Mermaid only once
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    // Only render on client-side and when tasks exist
    if (!isClient || !tasks.length || !mermaidRef.current) return;

    const renderChart = async () => {
      try {
        // Generate the Mermaid Gantt chart definition string
        const chartDefinition = `
gantt
    dateFormat  YYYY-MM-DD
    title Gantt Chart
    excludes    weekends
${tasks
  .map(
    (task) =>
      `    section ${task.id}\n    ${task.name} :${task.id}, ${formatDate(
        task.start,
      )}, ${formatDate(task.end)}`,
  )
  .join("\n")}
`;

        // Clear previous render if ref exists
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = "";

          // Unique ID for this render
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          mermaidRef.current.id = id;

          // Set mermaid content
          mermaidRef.current.textContent = chartDefinition;

          try {
            // Process the diagram
            await mermaid.run({
              nodes: mermaidRef.current
                ? [mermaidRef.current as HTMLElement]
                : [],
            });
          } catch (error) {
            console.error("Mermaid run error:", error);
            try {
              // Alternative method as fallback
              const { svg } = await mermaid.render(
                "mermaid-graph",
                chartDefinition,
              );
              if (mermaidRef.current) {
                mermaidRef.current.innerHTML = svg;
              }
            } catch (fallbackError) {
              console.error("Mermaid fallback rendering error:", fallbackError);
              if (mermaidRef.current) {
                mermaidRef.current.innerHTML =
                  '<p style="color: red;">Error rendering Gantt chart.</p>';
              }
            }
          }
        }
      } catch (error) {
        console.error("Mermaid chart preparation error:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML =
            '<p style="color: red;">Error preparing Gantt chart data.</p>';
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderChart();
    }, 100);

    return () => clearTimeout(timer);
  }, [tasks, isClient]);
  return (
    <Paper elevation={3} sx={{ p: 4, overflow: "hidden" }}>
      <Typography variant="h6" gutterBottom>
        Gantt Chart (Mermaid)
      </Typography>
      <Box
        sx={{
          height: 500, // Adjust height as needed
          width: "100%",
          overflow: "auto", // Enable scrolling for large charts
        }}
      >
        {isClient ? (
          <>
            <div
              ref={mermaidRef}
              className="mermaid"
              key={`mermaid-container-${tasks.length}`}
            >
              {/* Mermaid will render here */}
            </div>
            {tasks.length === 0 && (
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
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography>Loading chart...</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default GanttChart;
