const TARGETS: Record<string, string> = {
  sample: 'https://example.com',
}

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1'

  if (!isLocalDev) {
    const cookie = context.request.headers.get('Cookie') || ''
    if (!cookie.includes('CF_Authorization')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const path = context.params.path as string
  const target = TARGETS[path]

  if (!target) {
    return new Response(JSON.stringify({ error: 'not found', path }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ url: target }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
