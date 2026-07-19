/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08111f",
          900: "#0b1a2b",
          800: "#12243b"
        },
        sand: {
          50: "#f9f3e7",
          100: "#f4e7cf"
        },
        coral: {
          400: "#ff8a5b",
          500: "#f97316"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(249, 115, 22, 0.22)"
      }
    }
  },
  plugins: []
};
