import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Visitors can use FirstPilot fully without an account. */
export const isGoogleAuthEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: isGoogleAuthEnabled ? [Google] : [],
  trustHost: true,
});
