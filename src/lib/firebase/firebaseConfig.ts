/**
 * Firebase Config API Client
 *
 * This module provides a client-side function to fetch Firebase configuration
 * from the external API. The API endpoint is configured via environment variable
 * to allow flexibility for different environments.
 *
 * Note: For static builds, this makes a direct client-side call to the external API.
 * The endpoint URL is stored in NEXT_PUBLIC_FIREBASE_CONFIG_API_URL environment variable.
 * Cookies are automatically included by the browser when credentials: 'include' is set.
 */

/**
 * Response structure from Firebase config API
 */
export interface FirebaseConfigResponse {
  error: boolean;
  message: string;
  data?: {
    data?: {
      firebase_api_key?: string;
      firebase_auth_domain?: string;
      firebase_storage_bucket?: string;
      firebase_messaging_sender_id?: string;
      firebase_app_id?: string;
      firebase_measurement_id?: string;
      firebase_service_file?: string;
      [key: string]: unknown; // Allow additional fields
    };
    [key: string]: unknown; // Allow additional nested data
  };
}

/**
 * Get Firebase config API endpoint from environment variable
 * Falls back to default if not set
 */
function getFirebaseConfigApiUrl(): string {
  // Get API URL from environment variable
  // This allows different endpoints for different environments
  const apiUrl = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  // Default fallback (can be overridden via env var)
  return 'https://wrteam.net/api/firebase-config';
}

/**
 * Fetch Firebase configuration from external API
 *
 * This function makes a direct client-side call to the Firebase config API.
 * The API endpoint is configured via NEXT_PUBLIC_FIREBASE_CONFIG_API_URL environment variable.
 * Cookies are automatically sent by the browser for same-origin or CORS-enabled requests.
 *
 * @returns Promise with Firebase config response
 * @throws Error if the API call fails
 */
export async function getFirebaseConfig(): Promise<FirebaseConfigResponse> {
  try {
    // Get the API endpoint from environment variable
    const apiUrl = getFirebaseConfigApiUrl();
    // console.log('[FCM Debug] getFirebaseConfig: Fetching from URL:', apiUrl);

    // Make direct call to external API
    // Cookies are automatically included by the browser
    // console.log('[FCM Debug] getFirebaseConfig: Making fetch request...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      // Include cookies automatically (browser handles this)
      credentials: 'include',
      // Don't cache to ensure fresh config
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // console.log(
    //   '[FCM Debug] getFirebaseConfig: Response status:',
    //   response.status,
    //   response.statusText
    // );

    // Check if the response is ok
    if (!response.ok) {
      // console.error(
      //   '[FCM Debug] getFirebaseConfig: Response not OK:',
      //   response.status,
      //   response.statusText
      // );
      throw new Error(
        `Failed to fetch Firebase config: ${response.statusText}`
      );
    }

    // Parse and return the response
    const data: FirebaseConfigResponse = await response.json();
    // console.log('[FCM Debug] getFirebaseConfig: Parsed response:', {
    //   error: data.error,
    //   message: data.message,
    //   hasData: !!data.data,
    //   dataKeys: data.data ? Object.keys(data.data) : [],
    // });
    return data;
  } catch (error) {
    // Log error for debugging
    // console.error('Error fetching Firebase config:', error);

    // Re-throw with a user-friendly message
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch Firebase configuration'
    );
  }
}
