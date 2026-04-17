const WORKER_URL = 'https://groq-proxy.molvicstudios.pro'

export async function callGroq(messages, system) {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system })
  })
  if (!response.ok) throw new Error(`Error ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error.message || data.error)
  const text = data.choices[0].message.content
  return text.replace(/```json|```/g, '').trim()
}
