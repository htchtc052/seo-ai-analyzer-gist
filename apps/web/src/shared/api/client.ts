import { ofetch } from "ofetch";

export const apiClient = ofetch.create({
  baseURL: `${import.meta.env.BASE_URL}api`,
});
