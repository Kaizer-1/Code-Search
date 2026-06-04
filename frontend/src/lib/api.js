const API_BASE_URL = 'http://localhost:8000';

export async function search(query, mode = 'bm25', expandQuery = false) {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      mode,
      k: 10,
      expand_query: expandQuery,
    }),
  });

  if (!response.ok) {
    throw new Error('Search request failed');
  }

  return response.json();
}

export async function getClusterSamples(clusterId) {
  const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cluster samples');
  }
  return response.json();
}

export async function getEvalResults() {
  const response = await fetch(`${API_BASE_URL}/eval`);
  if (!response.ok) {
    throw new Error('Failed to fetch evaluation results');
  }
  return response.json();
}
