"use client";

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface GanttChartProps {
  tasks: Task[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  return (
    <Paper elevation={3} sx={{ p: 4, overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Gantt Chart
      </Typography>
      
      <Box 
        sx={{ 
          height: 500, 
          width: '100%',
          overflowX: 'auto',
        }}
      >
        {tasks.length > 0 ? (
          <Gantt
            tasks={tasks}
            viewMode={ViewMode.Month}
            listCellWidth="180px"
            columnWidth={65}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography>
              No data to display
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default GanttChart;
