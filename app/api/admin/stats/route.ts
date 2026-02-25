import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Incident from '@/models/Incident';
import SOS from '@/models/SOS';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const totalUsers = await User.countDocuments();
    const totalIncidents = await Incident.countDocuments();
    const activeSOSCount = await SOS.countDocuments({ active: true });
    const recentIncidents = await Incident.find().sort({ timestamp: -1 }).limit(5);

    // Get detailed active SOS signals
    const activeSOSSignals = await SOS.find({ active: true })
        .populate('userId', 'name email phone')
        .sort({ startedAt: -1 });

    return NextResponse.json({
        totalUsers,
        totalIncidents,
        activeSOSCount,
        recentIncidents,
        activeSOSSignals,
    });
}
