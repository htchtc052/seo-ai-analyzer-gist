import { ofetch } from "ofetch";

export const apiClient = ofetch.create({
  baseURL: "/api",
});
