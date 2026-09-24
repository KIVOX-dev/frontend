import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ForHrPage from "./page";

// The HR audience marketing page ("/for-hr") — TalentSnapsLanding rendered
// with HR_CONTENT copy instead of the root page's ROOT_CONTENT.
const meta = {
  title: "Landing Pages/For HR",
  component: ForHrPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ForHrPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
