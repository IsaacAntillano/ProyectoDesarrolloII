import axios from 'axios';

export const SERVER_UNREACHABLE_MESSAGE =
  'No se pudo conectar con el servidor. Verifica que el backend esté activo (puerto 8080).';

export function isServerUnreachable(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message as string;
  }
  return fallback;
}