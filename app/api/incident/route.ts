import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Incident from '@/models/Incident';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { description, location, mediaUrl, incidentType, severity, isAnonymous } = body;

        await dbConnect();
        const incident = await Incident.create({
            userId: (session.user as any).id,
            description,
            location,
            mediaUrl,
            incidentType: incidentType || 'Other',
            severity: severity || 'Medium',
            isAnonymous: !!isAnonymous,
        });

        return NextResponse.json(incident, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // If admin, show all, otherwise show user's own
    const query = (session.user as any).role === 'admin' ? {} : { userId: (session.user as any).id };
    const incidents = await Incident.find(query).sort({ timestamp: -1 });

    return NextResponse.json(incidents);
}
