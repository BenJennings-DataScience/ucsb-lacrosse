import { NextResponse } from 'next/server';

/**
 * TODO: LinkedIn enrichment
 *
 * When wired up, this endpoint should:
 * 1. Accept { alumni_id: string, linkedin_url: string }
 * 2. Call LinkedIn API or Proxycurl (https://nubela.co/proxycurl) to fetch:
 *    - Current job title
 *    - Current company
 *    - Industry
 *    - Professional bio / summary
 * 3. Upsert those fields into the `alumni` table row
 * 4. Set linkedin_synced = true, linkedin_synced_at = now()
 *
 * Proxycurl example:
 *   GET https://nubela.co/proxycurl/api/v2/linkedin
 *   ?url=https://www.linkedin.com/in/username
 *   Authorization: Bearer PROXYCURL_API_KEY
 *
 * Environment variables needed:
 *   PROXYCURL_API_KEY  or  LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET
 */

export async function POST(req: Request) {
  const { alumni_id, linkedin_url } = await req.json();

  if (!alumni_id || !linkedin_url) {
    return NextResponse.json({ error: 'alumni_id and linkedin_url required' }, { status: 400 });
  }

  // TODO: implement enrichment
  return NextResponse.json({ message: 'LinkedIn enrichment not yet implemented', alumni_id, linkedin_url }, { status: 501 });
}
