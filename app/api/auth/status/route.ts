import { NextResponse } from "next/server";
import { isGoogleAuthEnabled } from "@/auth";
export function GET() { return NextResponse.json({ googleEnabled: isGoogleAuthEnabled }); }
