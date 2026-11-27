"use client";

import createCache, { Options } from "@emotion/cache";
import { CacheProvider, ThemeProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { useServerInsertedHTML } from "next/navigation";
import React from "react";

// Fork: "Studio Floor" look for The Comedy Archive. Colours and fonts live
// here and in shared/siteConfig.ts, so upstream merges stay small.
const headingFont = '"Archivo Variable", "Archivo", "Arial Narrow", sans-serif';
const heading = {
  fontFamily: headingFont,
  fontWeight: 800,
  fontStretch: "80%",
  letterSpacing: "0.01em",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#F5C518", contrastText: "#0E0F13" },
    secondary: { main: "#3FC1D9", contrastText: "#0E0F13" },
    background: { default: "#0E0F13", paper: "#171922" },
    text: { primary: "#EDEDF2", secondary: "#B9BBC7" },
    divider: "#262833",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: { ...heading, fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(14, 15, 19, 0.92)",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiLink: { defaultProps: { color: "secondary" } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "#262833", fontSize: "0.8rem" },
      },
    },
  },
});

// This implementation is from emotion-js
// https://mui.com/material-ui/guides/next-js-app-router/
// https://github.com/emotion-js/emotion/issues/2928#issuecomment-1319747902
export default function ThemeRegistry(props: {
  children: React.ReactNode;
  options: Options;
}) {
  const { options, children } = props;

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;

    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
