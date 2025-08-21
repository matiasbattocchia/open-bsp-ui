/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./public/icons.svg"],
  theme: {
    extend: {
      colors: {
        gray: "#f0f2f5",
        "gray-dark": "#6f7f88",
        "gray-hover": "#f5f6f6",
        "gray-light": "#a4aeb3",
        "gray-line": "#e9edef",
        "gray-icon": "#54656f",
        "gray-icon-bg": "#d9dbde",
        "green-wp": "#b5a5e5",
        "green-light": "#d9fdd3",
        "green-dark": "#00A884",
        "blue-ack": "#53bdeb",
        verde: "#61f86c",
        celeste: "#85e7e2",
        azul: "#94b6d8",
        violeta: "#d381e8",
        background: "#f0f2f5",
        hover: "#f5f6f6",
        active: "#f0f2f5",
        border: "#e9edef",
      },
      backgroundImage: {
        chat: "url('/bg-chat-tile-dark.png'), linear-gradient(to bottom right, rgb(247 254 231), rgb(253 244 255), rgb(240 249 255))",
      },
      boxShadow: {
        "chat-bubble": "0 1px .5px 0 rgba(11, 20, 26, 0.13)",
      },
    },
  },
  plugins: [],
};
