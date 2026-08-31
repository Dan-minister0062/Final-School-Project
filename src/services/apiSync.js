// src/services/apiSync.js - shared helpers for background data sync
import api from './api';

export function isAuthenticated() {
  try {
    return !!(localStorage.getItem('token') || localStorage.getItem('access_token'));
  } catch {
    return false;
  }
}

export function getToken() {
  try {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  } catch {
    return null;
  }
}

export async function syncGet(url, params = {}) {
  if (!isAuthenticated()) return null;
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.warn(`[apiSync] GET ${url} failed:`, error?.message || error);
    return null;
  }
}

export async function syncSend(method, url, payload = {}) {
  if (!isAuthenticated()) return null;
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

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
