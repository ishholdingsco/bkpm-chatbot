// Barrel for shared UI primitives + demo data.
// Import from "@/components/ui" rather than reaching into individual files.

export { DATA, KIND_COLOR } from "./data";
export {
  Avatar,
  AvatarStack,
  Logo,
  BKPM,
  TopBar,
  Cite,
  ArtifactCard,
} from "./primitives";
export { ToastHost, toast, comingSoon, ComingSoonButton } from "./Toast";
export { LanguageProvider, useI18n, LangToggle, LANGUAGES } from "./i18n";
export { DesktopOnlyGate } from "./DesktopOnlyGate";
