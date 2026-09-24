import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Home from "./page";

// The root marketing page ("/") — learner audience. Renders
// TalentSnapsLanding with its default ROOT_CONTENT copy (see
// components/landing/talentsnaps/landingContent.ts).
const meta = {
  title: "Landing Pages/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
