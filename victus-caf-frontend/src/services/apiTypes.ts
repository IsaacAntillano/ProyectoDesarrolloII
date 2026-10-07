export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}