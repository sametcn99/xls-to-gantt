"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Collapse,
  TextField,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CodeIcon from "@mui/icons-material/Code";
import DownloadIcon from "@mui/icons-material/Download";
import mermaid from "mermaid";

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
  const [showCode, setShowCode] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");

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
        // Store the Mermaid code for display
        setMermaidCode(chartDefinition);

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

            // Store SVG content for download
            if (mermaidRef.current) {
              const svgElement = mermaidRef.current.querySelector("svg");
              if (svgElement) {
                const svgString = new XMLSerializer().serializeToString(
                  svgElement,
                );
                setSvgContent(svgString);
              }
            }
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
                setSvgContent(svg);
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

  // Function to handle copying code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000); // Hide success message after 3 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Function to download SVG
  const handleDownloadSvg = () => {
    if (!svgContent) {
      console.error("No SVG content available");
      return;
    }

    try {
      // Create a Blob from the SVG content
      const blob = new Blob([svgContent], { type: "image/svg+xml" });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gantt-chart-${new Date().toISOString().split("T")[0]}.svg`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      // Show success message
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to download SVG: ", err);
    }
  };

  // Toggle code visibility
  const toggleCodeVisibility = () => {
    setShowCode(!showCode);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Gantt Chart (Mermaid)
        </Typography>
        <Box>
          <Button
            startIcon={<CodeIcon />}
            onClick={toggleCodeVisibility}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          >
            {showCode ? "Hide Code" : "Show Code"}
          </Button>{" "}
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadSvg}
            variant="outlined"
            size="small"
            disabled={!svgContent}
            sx={{ mr: 1 }}
          >
            Download SVG
          </Button>
        </Box>
      </Box>
      <Collapse in={showCode}>
        <Box
          sx={{
            mb: 2,
            position: "relative",
            bgcolor: "#f5f5f5",
            borderRadius: 1,
            p: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            value={mermaidCode}
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: "monospace",
                whiteSpace: "pre",
                fontSize: "0.875rem",
              },
            }}
            variant="outlined"
            minRows={5}
            maxRows={15}
          />
          <IconButton
            sx={{ position: "absolute", top: 8, right: 8 }}
            onClick={handleCopyCode}
            color="primary"
            title="Copy to clipboard"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>
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
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Code copied to clipboard!
        </Alert>
      </Snackbar>{" "}
      <Snackbar
        open={downloadSuccess}
        autoHideDuration={3000}
        onClose={() => setDownloadSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          SVG downloaded successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default GanttChart;
