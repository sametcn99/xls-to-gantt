"use client";

import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Button,
  SelectChangeEvent,
  Grid,
} from "@mui/material";

interface ColumnSelectorProps {
  columns: string[];
  selectedColumns: {
    description: string;
    startDate: string;
    endDate: string;
  };
  onColumnSelect: (
    type: "description" | "startDate" | "endDate",
    column: string,
  ) => void;
  onConfirm: () => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  selectedColumns,
  onColumnSelect,
  onConfirm,
}) => {
  const handleChange =
    (type: "description" | "startDate" | "endDate") =>
    (event: SelectChangeEvent) => {
      onColumnSelect(type, event.target.value);
    };

  const isComplete =
    selectedColumns.description &&
    selectedColumns.startDate &&
    selectedColumns.endDate;

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Map Columns
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the necessary Excel columns to generate the Gantt chart
      </Typography>{" "}
      <Grid container spacing={3} component="div">
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="description-column-label">
              Description Column
            </InputLabel>
            <Select
              labelId="description-column-label"
              value={selectedColumns.description}
              label="Description Column"
              onChange={handleChange("description")}
            >
              <MenuItem value="">
                <em>Select...</em>
              </MenuItem>
              {columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="start-date-column-label">
              Start Date Column
            </InputLabel>
            <Select
              labelId="start-date-column-label"
              value={selectedColumns.startDate}
              label="Start Date Column"
              onChange={handleChange("startDate")}
            >
              <MenuItem value="">
                <em>Select...</em>
              </MenuItem>
              {columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="end-date-column-label">End Date Column</InputLabel>
            <Select
              labelId="end-date-column-label"
              value={selectedColumns.endDate}
              label="End Date Column"
              onChange={handleChange("endDate")}
            >
              <MenuItem value="">
                <em>Select...</em>
              </MenuItem>
              {columns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!isComplete}
          onClick={onConfirm}
        >
          Generate Gantt Chart
        </Button>
      </Box>
    </Paper>
  );
};

export default ColumnSelector;
