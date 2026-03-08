import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SecureLink } from '@/models/SecureLink';
import User from '@/models/User';
import SOS from '@/models/SOS';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        await dbConnect();

        const link = await SecureLink.findOne({ token }).populate('userId', 'name');

        if (!link || !link.active) {
            return NextResponse.json({ message: 'Link Invalid or Destroyed' }, { status: 404 });
        }

        if (new Date() > new Date(link.expiresAt)) {
            link.active = false;
            await link.save();
            return NextResponse.json({ message: 'Link Expired' }, { status: 404 });
        }

        // Capture standard payload
        const payload: any = {
            sharedBy: link.userId?.name || 'Unknown User',
            location: link.location,
            createdAt: link.createdAt,
            expiresAt: link.expiresAt
        };

        // Check if user has an active SOS for live context
        const activeSos = await SOS.findOne({ userId: link.userId._id, active: true });
        if (activeSos) {
            payload.activeSos = {
                location: activeSos.location,
                triggerType: activeSos.triggerType,
                batteryLevel: activeSos.batteryLevel,
                createdAt: activeSos.createdAt
            };
        }

        // Burn after read handling
        if (link.burnAfterRead) {
            link.active = false; // Destroy link after first fetch
        }
        link.viewedAt = new Date();
        await link.save();

        return NextResponse.json(payload, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
