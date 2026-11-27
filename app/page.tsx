import DateGeneratedFooter from "@/app/footer/DateGeneratedFooter";
import { segmentsLabel, siteDescription, siteName } from "@/shared/siteConfig";
import {
  getLatestSketchGrid,
  getTrendingSketchGrid,
  getUpcomingBirthdays,
} from "@/backend/content/homeService";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Box, Typography } from "@mui/material";
import { Suspense } from "react";
import SketchGrid from "./components/SketchGrid";
import MuiNextLink from "./components/MuiNextLink";
import UpcomingBirthdays from "./components/UpcomingBirthdays";

export const revalidate = 300; // 5 minutes

export default async function HomePage() {
  // Data fetching
  async function getLatestSketchData(page: number) {
    "use server";
    return await getLatestSketchGrid(page);
  }

  async function getTrendingSketchData(page: number) {
    "use server";
    return await getTrendingSketchGrid(page);
  }

  const latestSketchData = await getLatestSketchData(1);
  const trendingSketchData = await getTrendingSketchData(1);
  const upcomingBirthdays = await getUpcomingBirthdays();

  // Rendering
  return (
    <>
      <Box style={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ mt: 4, mb: 1 }}>
          <Typography component="h1" variant="h3">
            {siteName}
          </Typography>
          <Typography color="text.secondary">{siteDescription}</Typography>
        </Box>
        <Box style={{ marginTop: 16 }}>
          <Suspense fallback={<div>Loading...</div>}>
            <SketchGrid
              initialData={latestSketchData}
              getData={getLatestSketchData}
              title={`Latest ${segmentsLabel.toLowerCase()}`}
            />
            <UpcomingBirthdays birthdays={upcomingBirthdays} />
            <SketchGrid
              initialData={trendingSketchData}
              getData={getTrendingSketchData}
              title={`Trending ${segmentsLabel.toLowerCase()}`}
              icon={<TrendingUpIcon />}
            />
          </Suspense>
        </Box>
        <Box style={{ marginTop: 48 }} className="about-page">
          <Typography
            component="div"
            variant="body2"
            color="textSecondary"
            textAlign={"center"}
          >
            More about this archive on the{" "}
            <MuiNextLink href="/about">About page</MuiNextLink>.
          </Typography>
        </Box>
        <DateGeneratedFooter genDate={new Date()} type="page" />
      </Box>
    </>
  );
}
