export async function registerPushToken(params: {
  userId: string;
  token: string;
  platform?: 'ANDROID' | 'IOS';
}) {
  const res = await fetch('http://localhost:8080/alarm/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: params.userId,
      token: params.token,
      platform: params.platform ?? 'ANDROID',
    }),
  });
  if (!res.ok) throw new Error(`Failed to register token: ${res.status}`);
}
