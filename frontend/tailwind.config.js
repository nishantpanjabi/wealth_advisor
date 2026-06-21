/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        ink: "#131314",
        mist: "#ebefe8",
        moss: "#9cc96b",
        rust: "#ce5f34",
        sea: "#0f5757",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(19, 19, 20, 0.12)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 0 0, rgba(255,255,255,0.45) 0, rgba(255,255,255,0) 48%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3) 0, rgba(255,255,255,0) 40%)",
      },
    },
  },
  plugins: [],
};
