// src/services/apiSync.js - shared helpers for background data sync
import api from './api';

export async function syncGet(url, params = {}) {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 401) return null;
    console.warn(`[apiSync] GET ${url} failed:`, error?.message || error);
    return null;
  }
}

export async function syncSend(method, url, payload = {}) {
  try {
    const response = await api[method](url, payload);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 401) return null;
    console.warn(`[apiSync] ${method.toUpperCase()} ${url} failed:`, error?.message || error);
    return null;
  }
}

export function createCooldown(ms) {
  let last = 0;
  return (fn) => {
    const now = Date.now();
    if (now - last < ms) return undefined;
    last = now;
    return fn();
  };
}