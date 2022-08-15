export function makeResponse(body: object, init: ResponseInit = {}) {
  return new Response(JSON.stringify({ status: 'Ok', data: body }), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });
}

export function makeErrorResponse(message: string, init: ResponseInit = {}) {
  return new Response(JSON.stringify({ status: 'Error', message }), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });
}

export function now() {
  return new Date();
}
