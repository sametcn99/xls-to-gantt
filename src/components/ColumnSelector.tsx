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
        Sütunları Eşleştirin
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gantt tablosu oluşturmak için gerekli Excel sütunlarını seçin
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
              Açıklama Sütunu
            </InputLabel>
            <Select
              labelId="description-column-label"
              value={selectedColumns.description}
              label="Açıklama Sütunu"
              onChange={handleChange("description")}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
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
              Başlangıç Tarihi Sütunu
            </InputLabel>
            <Select
              labelId="start-date-column-label"
              value={selectedColumns.startDate}
              label="Başlangıç Tarihi Sütunu"
              onChange={handleChange("startDate")}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
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
            <InputLabel id="end-date-column-label">
              Bitiş Tarihi Sütunu
            </InputLabel>
            <Select
              labelId="end-date-column-label"
              value={selectedColumns.endDate}
              label="Bitiş Tarihi Sütunu"
              onChange={handleChange("endDate")}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
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
          Gantt Tablosunu Oluştur
        </Button>
      </Box>
    </Paper>
  );
};

export default ColumnSelector;
