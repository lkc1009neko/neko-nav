export async function onRequest(context) {
  const cookie = context.request.headers.get('Cookie') || ''
  const authed = cookie.includes('CF_Authorization')

  let user = ''
  if (authed) {
    user = context.request.headers.get('Cf-Access-Authenticated-User') || ''
  }

  return new Response(JSON.stringify({ authenticated: authed, user }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
