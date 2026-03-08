import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { SecureLink } from '@/models/SecureLink';
import crypto from 'crypto';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { expiry, burnAfterRead, location } = await req.json();
        await dbConnect();

        // calculate expiration
        let hours = 1;
        if (expiry === '12h') hours = 12;
        if (expiry === '24h') hours = 24;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        // generate a cryptographic token
        const token = crypto.randomBytes(16).toString('hex');

        const link = await SecureLink.create({
            token,
            userId: (session.user as any).id,
            burnAfterRead: !!burnAfterRead,
            expiresAt,
            location: location || undefined
        });

        return NextResponse.json({ token, link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/l/${token}` }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
