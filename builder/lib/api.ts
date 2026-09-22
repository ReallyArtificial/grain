const API_URL = "https://grain.reallyartificial.org/api/build"

export async function buildSpec(spec: object, channel?: string) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spec, channel }),
  })
  return res.json()
}
