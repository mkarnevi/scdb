"use client";

import { segmentsLabel, siteName } from "@/shared/siteConfig";
import ApiIcon from "@mui/icons-material/Api";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { LinearProgress, Stack, Tooltip } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import { usePathname } from "next/navigation";
import { MouseEvent, useState } from "react";
import MuiNextLink from "../components/MuiNextLink";
import usePageLoading from "../hooks/usePageLoading";
import EditViewButton from "./EditViewButton";
import UserMenu from "./UserMenu";

// Fork: The Comedy Archive header ("Studio Floor" look)

const YELLOW = "#F5C518";
const CYAN = "#3FC1D9";

const pages = [
  { label: "Shows", href: "/shows" },
  { label: segmentsLabel, href: "/sketches" },
  { label: "People", href: "/people" },
  { label: "Characters", href: "/characters" },
  { label: "Categories", href: "/categories" },
  { label: "Years", href: "/years" },
];

function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <MuiNextLink
      href="/"
      aria-label={`${siteName} home`}
      underline="none"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        color: "text.primary",
        fontFamily: '"Archivo Variable", "Archivo", sans-serif',
        fontStretch: "75%",
        fontWeight: 900,
        fontSize: compact ? "1.15rem" : { xs: "0.92rem", sm: "1.35rem" },
        letterSpacing: { xs: "0.01em", sm: "0.04em" },
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        "&:hover": { color: "text.primary" },
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{ display: "inline-flex", gap: "3px" }}
      >
        <Box
          component="span"
          sx={{ width: 8, height: 22, bgcolor: YELLOW, borderRadius: "2px" }}
        />
        <Box
          component="span"
          sx={{ width: 8, height: 22, bgcolor: CYAN, borderRadius: "2px" }}
        />
      </Box>
      {siteName}
    </MuiNextLink>
  );
}

function ResponsiveAppBar() {
  // Hooks
  const pageLoading = usePageLoading();
  const pathname = usePathname().toLowerCase();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  // Event handlers
  function handleOpenNavMenu(event: MouseEvent<HTMLElement>) {
    setAnchorElNav(event.currentTarget);
  }

  function handleCloseNavMenu() {
    setAnchorElNav(null);
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Rendering
  return (
    <AppBar
      aria-label="Page Header"
      position="sticky"
      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Toolbar
        sx={{
          gap: { xs: 0.5, sm: 2 },
          px: { xs: 0.5, sm: 3 },
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {/* Hamburger menu on small screens */}
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            aria-label="Open menu"
            aria-controls="hamburger-menu"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="hamburger-menu"
            component="nav"
            aria-label="Main"
            anchorEl={anchorElNav}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            keepMounted
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
          >
            {pages.map((page) => (
              <MenuItem
                key={page.href}
                component={MuiNextLink}
                href={page.href}
                prefetch={false}
                onClick={handleCloseNavMenu}
                selected={isActive(page.href)}
              >
                {page.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Wordmark />

        {/* Main navigation on wider screens */}
        <Box
          component="nav"
          aria-label="Main"
          sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 2 }}
        >
          {/*
           * Prefetch is off for header links: no data comes down, so it would be
           * a wasted request and a cache miss
           */}
          {pages.map((page) => {
            const active = isActive(page.href);
            return (
              <Button
                key={page.href}
                component={MuiNextLink}
                href={page.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                sx={{
                  color: active ? "text.primary" : "text.secondary",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  borderRadius: 0,
                  borderBottom: "2px solid",
                  borderColor: active ? YELLOW : "transparent",
                  "&:hover": { color: YELLOW, backgroundColor: "transparent" },
                }}
              >
                {page.label}
              </Button>
            );
          })}
        </Box>

        {/* Right side icons */}
        <Stack direction="row" sx={{ ml: "auto", alignItems: "center" }}>
          <EditViewButton />
          <Tooltip title={`Browse and filter ${segmentsLabel.toLowerCase()}`}>
            <IconButton
              aria-label={`Browse and filter ${segmentsLabel.toLowerCase()}`}
              component={MuiNextLink}
              href="/sketches"
              color="inherit"
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="API reference">
            <IconButton
              aria-label="API reference"
              component={MuiNextLink}
              href="/api-reference"
              color="inherit"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              <ApiIcon />
            </IconButton>
          </Tooltip>
          <UserMenu />
        </Stack>
      </Toolbar>

      {pageLoading && (
        <LinearProgress
          sx={{
            position: "absolute",
            bottom: -1,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: "transparent",
            "& .MuiLinearProgress-bar": { backgroundColor: YELLOW },
          }}
        />
      )}
    </AppBar>
  );
}
export default ResponsiveAppBar;
