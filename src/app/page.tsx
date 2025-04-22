"use client";

import React from "react";
import { Container, Typography, Box, Paper } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Material UI Integration Demo
        </Typography>

        <Typography paragraph>
          This page demonstrates that Material UI has been successfully
          integrated into your Next.js project.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Material UI Components
        </Typography>

        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            p: 2,
            borderRadius: 1,
            mb: 2,
          }}
        >
          Primary Color Box
        </Box>

        <Box
          sx={{
            bgcolor: "secondary.main",
            color: "white",
            p: 2,
            borderRadius: 1,
          }}
        >
          Secondary Color Box
        </Box>
      </Paper>
    </Container>
  );
}
