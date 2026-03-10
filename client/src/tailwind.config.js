export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-red-500",
    "hover:bg-green-600",
    "hover:bg-blue-600",
    "hover:bg-purple-600",
    "hover:bg-red-600",
    "text-green-500",
    "text-blue-500",
    "text-purple-500",
    "text-red-500",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};