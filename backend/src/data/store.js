import { initStore } from './seed.js';

let data = null;

export async function getStore() {
  if (!data) {
    data = await initStore();
  }
  return data;
}

export function getStoreSync() {
  return data;
}
