import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SOS from '@/models/SOS';
import User from '@/models/User';
import { sendSMS } from '@/lib/twilio';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { location, triggerType, batteryLevel } = body;
        await dbConnect();

        // Get full user info with contacts
        const user = await User.findById((session.user as any).id);

        // Deactivate any previous active SOS
        await SOS.updateMany(
            { userId: (session.user as any).id, active: true },
            { active: false, endedAt: new Date() }
        );

        const sos = await SOS.create({
            userId: (session.user as any).id,
            location: {
                lat: location?.lat,
                lng: location?.lng,
                address: location?.address || '',
            },
            triggerType: triggerType || 'Manual',
            batteryLevel: batteryLevel,
            active: true,
        });

        // 🚨 SEND SMS TO EMERGENCY CONTACTS
        if (user?.emergencyContacts && user.emergencyContacts.length > 0) {
            const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
            const message = `🚨 EMERGENCY: ${user.name} has triggered an SOS! Location: ${mapLink}. Battery: ${batteryLevel}%`;

            // Fire and forget (don't block the API response for multiple SMS)
            user.emergencyContacts.forEach((contact: any) => {
                sendSMS(contact.phone, message).catch(err => console.error(`Failed SMS to ${contact.phone}`, err));
            });
        }

        return NextResponse.json(sos, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await req.json();
        await dbConnect();

        const sos = await SOS.findOneAndUpdate(
            { _id: id, userId: (session.user as any).id },
            { active: false, endedAt: new Date() },
            { new: true }
        );

        return NextResponse.json(sos);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const activeSos = await SOS.findOne({
        userId: (session.user as any).id,
        active: true
    });

    return NextResponse.json(activeSos);
}
