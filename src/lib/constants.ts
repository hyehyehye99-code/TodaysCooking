export const MAX_RECIPE_PHOTOS = 5;

// Set (briefly) by /auth/setup when it couldn't create a household for a
// signed-in user, so (app)/layout.tsx shows a retry screen instead of
// redirecting back into the same failing route forever.
export const HOUSEHOLD_SETUP_FAILED_COOKIE = "household_setup_failed";
