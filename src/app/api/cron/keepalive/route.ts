import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * Appelée chaque semaine par Vercel Cron (voir vercel.json). Upstash supprime
 * les bases gratuites restées 14 jours sans activité : une simple commande
 * suffit à garder celle des limites de tentatives en vie.
 * Vercel envoie automatiquement "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return NextResponse.json({ ok: false, reason: "upstash_not_configured" });
  }

  try {
    await new Redis({ url, token }).ping();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Keep-alive Upstash en échec", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
