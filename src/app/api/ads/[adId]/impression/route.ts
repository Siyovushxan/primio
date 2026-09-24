import { NextRequest } from "next/server";
import { trackAd } from "@/lib/track-ad";
export async function POST(req:NextRequest,{params}:{params:Promise<{adId:string}>}){return trackAd(req,(await params).adId,"impressions");}