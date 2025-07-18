/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'border-purple-500',
    'bg-purple-50',
    'text-purple-600',
    'bg-purple-500',
    'border-green-500',
    'bg-green-50',
    'text-green-600',
    'bg-green-500'
  ]
}