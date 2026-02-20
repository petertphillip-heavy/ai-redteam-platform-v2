/**
 * Download utilities for CSV export
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

/**
 * Trigger a file download from a Blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Fetch a CSV file from the API and download it
 */
export async function downloadCSV(
  endpoint: string,
  filename: string
): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    const errorText = await response.text();
    throw new Error(errorText || `Failed to download: ${response.statusText}`);
  }

  // Get filename from Content-Disposition header if available
  const contentDisposition = response.headers.get('Content-Disposition');
  let downloadFilename = filename;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (match && match[1]) {
      downloadFilename = match[1];
    }
  }

  const blob = await response.blob();
  downloadFile(blob, downloadFilename);
}

/**
 * Export findings to CSV
 */
export async function exportFindingsCSV(projectId?: string): Promise<void> {
  const endpoint = projectId
    ? `/api/export/findings?projectId=${encodeURIComponent(projectId)}`
    : '/api/export/findings';
  const filename = projectId
    ? `findings-${projectId}.csv`
    : 'findings-all.csv';
  await downloadCSV(endpoint, filename);
}

/**
 * Export test results to CSV
 */
export async function exportTestResultsCSV(testRunId: string): Promise<void> {
  const endpoint = `/api/export/tests/${encodeURIComponent(testRunId)}/results`;
  const filename = `test-results-${testRunId}.csv`;
  await downloadCSV(endpoint, filename);
}

/**
 * Export payloads to CSV
 */
export async function exportPayloadsCSV(): Promise<void> {
  await downloadCSV('/api/export/payloads', 'payloads.csv');
}
