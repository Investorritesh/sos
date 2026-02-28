import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SafetyReport from '@/models/SafetyReport';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { location, reportType, severity, description, isAnonymous, mediaUrl } = body;

        if (!location?.lat || !location?.lng || !reportType) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        let userId = null;
        try {
            const session = await getServerSession(authOptions);
            if (session && !isAnonymous) {
                userId = (session.user as any).id;
            }
        } catch { }

        const report = await SafetyReport.create({
            userId,
            location,
            reportType,
            severity: severity || 'medium',
            description: description || '',
            mediaUrl: mediaUrl || '',
            isAnonymous: !!isAnonymous,
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radius = parseFloat(searchParams.get('radius') || '0.05'); // ~5km in degrees

        await dbConnect();

        // Get reports within radius (simple bounding box query)
        const reports = await SafetyReport.find({
            'location.lat': { $gte: lat - radius, $lte: lat + radius },
            'location.lng': { $gte: lng - radius, $lte: lng + radius },
            expiresAt: { $gt: new Date() },
        })
            .sort({ timestamp: -1 })
            .limit(200);

        return NextResponse.json(reports);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
