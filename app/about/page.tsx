import { siteDescription, siteName } from "@/shared/siteConfig";
import { buildPageTitle } from "@/shared/utilities";
import { Box } from "@mui/material";
import { Metadata } from "next";
import Markdown from "react-markdown";

export const metadata: Metadata = {
  title: buildPageTitle("About"),
  description: `About ${siteName}`,
};

// Fork: About page for The Comedy Archive
export default function HelpPage() {
  // Rendering
  return (
    <>
      <Box className="about-page" style={{ marginTop: 32 }}>
        <Markdown>{`
# About

${siteName} is ${siteDescription.charAt(0).toLowerCase()}${siteDescription.slice(1)}: shows, seasons and episodes, broken down into the sketches and rounds inside them, with the people who made them.

Sketch shows list their **sketches**; panel shows list their **rounds**. Across the whole site, both are called **segments**.

### Adding content

* Create the show first, setting its format to Sketch or Panel, then its seasons and episodes
* Segments are added from the editor at \`/edit/sketches\`, or with the *Add* link under the [segment list](/sketches)
* Red fields on the form are required
* The show, season and episode drop-downs have a *create* link for adding a missing one

### Video

* A segment's video can be a link to YouTube and similar sites, or a file from the archive's own storage, such as \`/media/Show/Season 01/Episode.mp4\` (spaces written as \`%20\`)
* Segments inside a full episode get a start and end time, such as \`12:34\`. The player starts there, pauses at the end, and shows the episode's other segments as markers

### Images

* Pick a segment image with as many of the cast in it as possible
* For cast images, frame the face in the upper half with some margin at the sides
  * ![Framing example](/images/cast-img-framing.jpg)

### Saving changes

* Pages update immediately after saving; linked pages can take up to 5 minutes
* The pencil icon in the top bar opens the current page in the editor, and the eye icon goes back to viewing it

### Credits

${siteName} runs on a fork of [SCDB](https://github.com/swax/SCDB), the open source code behind SketchTV.lol, created by swax. This fork adds panel shows, local video and private self-hosting; its code is on [GitHub](https://github.com/mkarnevi/scdb).
`}</Markdown>
      </Box>
    </>
  );
}
