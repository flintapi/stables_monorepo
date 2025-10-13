// Authentication
export type APIKey = `Bearer ${string}`;

// Possible error shape
export interface BrailsError {
  code: number;
  message: string;
}
