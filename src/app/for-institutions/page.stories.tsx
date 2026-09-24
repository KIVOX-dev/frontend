import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ForInstitutionsPage from "./page";

// The institutional audience marketing page ("/for-institutions") — renders
// LandingPageBody with audience="institutional" (the shared body used by all
// 3 audience pages except the root, which still uses TalentSnapsLanding).
const meta = {
  title: "Landing Pages/For Institutions",
  component: ForInstitutionsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ForInstitutionsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
