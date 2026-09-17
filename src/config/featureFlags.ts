// Flip a flag to false to hide a feature from the UI (nav item + screen)
// without deleting any of its code — flip back to true and redeploy when
// ready to show it again. Nothing about the feature itself is removed;
// this only gates whether it's reachable from the sidebar/renderScreen.
export const FEATURE_FLAGS = {
  // "Learnings" (course list/viewer) and "YouTube to Course" (import form) —
  // off for the user-facing test group starting <the day this was flipped>,
  // pending the go-ahead to re-enable.
  youtubeToCourse: false,
};
