import axios from "axios";

const client = axios.create({
  baseURL: "/api"
});

export const fetchSlices = () => client.get("/slices").then((res) => res.data);
export const fetchAlerts = () => client.get("/alerts").then((res) => res.data);
export const createSlice = (payload) => client.post("/slices", payload).then((res) => res.data);
export const fetchSlice = (sliceId) => client.get(`/slices/${sliceId}`).then((res) => res.data);
export const fetchSliceAlerts = (sliceId) =>
  client.get(`/slices/${sliceId}/alerts`).then((res) => res.data);
export const addDevice = (sliceId, payload) =>
  client.post(`/slices/${sliceId}/devices`, payload).then((res) => res.data);
export const createSliceAlert = (sliceId, payload) =>
  client.post(`/slices/${sliceId}/alerts`, payload).then((res) => res.data);
export const resolveAlert = (alertId) =>
  client.post(`/alerts/${alertId}/resolve`).then((res) => res.data);

