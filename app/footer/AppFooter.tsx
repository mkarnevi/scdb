"use client";

import { siteDescription, siteName } from "@/shared/siteConfig";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Box, IconButton, Link, Tooltip, Typography } from "@mui/material";

// Fork: The Comedy Archive footer
export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 4,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {siteName} · {siteDescription}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        Built on{" "}
        <Link
          color="secondary"
          href="https://github.com/swax/SCDB"
          target="_blank"
          rel="noreferrer"
        >
          SCDB
        </Link>{" "}
        by swax
        <Tooltip title="This fork on GitHub">
          <IconButton
            aria-label="This fork on GitHub"
            href="https://github.com/mkarnevi/scdb"
            target="_blank"
            rel="noreferrer"
            size="small"
            color="inherit"
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
    </Box>
  );
}
