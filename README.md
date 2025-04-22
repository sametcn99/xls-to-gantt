# XLS to Gantt Chart Converter

A powerful and user-friendly tool for converting Excel files directly into interactive Gantt charts. Perfect for project managers, team leaders, and anyone who wants to visualize project timelines without the hassle of manual chart creation.

## ✨ Features

- **Easy Excel Import**: Upload your Excel files with project data in seconds
- **Smart Column Detection**: Automatically identifies task names, dates, and dependencies
- **Export Options**: Save your Gantt charts for presentations and reporting
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Live Demo

Try the application live at [https://xls-to-gantt.vercel.app/](https://xls-to-gantt.vercel.app/)

## 📋 Excel File Format

For the best results, your Excel file should include these columns:

- Task Name/ID
- Start Date
- End Date/Duration
- Dependencies (optional)
- Progress (optional)
- Resources (optional)

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (preferred package manager)
- Node.js 18.x or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/xls-to-gantt.git
cd xls-to-gantt
```

2. Install dependencies using Bun:

```bash
bun install
```

3. Run the development server:

```bash
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Material-UI](https://mui.com/) - UI component library
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [React-Gantt](https://www.npmjs.com/package/gantt-task-react) - Gantt chart visualization

## 📱 Screenshots

_[Add screenshots of your application here]_

## 🧩 Project Structure

```
src/
├── app/             # Next.js app directory
├── components/      # React components
│   ├── FileUploader.tsx
│   ├── ColumnSelector.tsx
│   ├── GanttChart.tsx
│   └── ...
├── hooks/           # React custom hooks
├── theme/           # Theme configuration
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
