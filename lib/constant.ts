export const SELECTD_FORMS = "FormList";
export const SELECTED_FORM = "SelectedForm";

export const clientId = process.env.NOTION_OAUTH_CLIENT_ID!;
export const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET!;
export const redirectUri =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/auth/callback/notion"
    : process.env.NOTION_OAUTH_REDIRECT_URI!;

export const API_NICE_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:8000"
  : "http://api.notion-nice.com";
export const NOTION_OAUTH_HOST = process.env.NODE_ENV === "development" ? "http://localhost:3000" : 'https://app.harvest.prius.ai';