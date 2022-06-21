export const onRequestGet = async ({ request }) => {
  return new Response(JSON.stringify({ status: 'OK' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
