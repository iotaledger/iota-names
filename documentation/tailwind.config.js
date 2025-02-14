// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/** @type {import("tailwindcss").Config} */

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx, md, mdx}",
    "./components/**/*.{js,ts,jsx,tsx, md, mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        blurple: "rgb(var(--iota-names-blurple) / <alpha-value>)",
        blurpleDark: "rgb(var(--iota-names-blurple-dark) / <alpha-value>)",
      }
    },
  },

}

