import { json } from "../_lib/auth.js";
import { computePrediction } from "../_lib/prediction.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT start_date, end_date FROM cycle_logs ORDER BY start_date ASC"
  ).all();

  return json(computePrediction(results || []));
}
