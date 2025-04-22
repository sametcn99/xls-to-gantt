import { createTheme } from "@mui/material/styles";

// Create a pure black theme instance
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: "#ff1744",
    },
    background: {
      default: "#000000", // Pure black background
      paper: "#000000", // Pure black for paper elements
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
});

export default theme;
