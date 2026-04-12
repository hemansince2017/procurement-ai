/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          high: "#dc2626",
          medium: "#ea580c",
          low: "#16a34a",
          neutral: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
