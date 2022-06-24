export function makeResponse(body: object, init: ResponseInit = {}) {
  return new Response(JSON.stringify({ status: 'Ok', data: body }), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init
  });
}

export function makeErrorResponse(message: string, init: ResponseInit = {}) {
  return new Response(JSON.stringify({ status: 'Error', message }), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init
  });
}
