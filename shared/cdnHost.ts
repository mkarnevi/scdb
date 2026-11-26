//import ProcessEnv from "./ProcessEnv";

// the || is here only for 'find all references' to work, process.env... is inlined at build time
// Fork: NEXT_PUBLIC_STATIC_URL overrides it, e.g. /static for local image storage
const staticUrl =
  process.env.NEXT_PUBLIC_STATIC_URL ||
  `https://${process.env.NEXT_PUBLIC_STATIC_HOSTNAME}`; // || ProcessEnv.NEXT_PUBLIC_STATIC_HOSTNAME;
export default staticUrl;
