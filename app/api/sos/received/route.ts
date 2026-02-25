import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SOS from '@/models/SOS';
import User from '@/models/User';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        await dbConnect();

        // 1. Get current user's phone number
        const currentUser = await User.findById((session.user as any).id);
        if (!currentUser || !currentUser.phone) {
            return NextResponse.json([]);
        }

        // 2. Find all users who have this phone number in their emergency contacts
        // We look for users where emergencyContacts contains an object with this phone
        const usersWhoListedMe = await User.find({
            'emergencyContacts.phone': currentUser.phone
        });

        if (usersWhoListedMe.length === 0) {
            return NextResponse.json([]);
        }

        const userIds = usersWhoListedMe.map(u => u._id);

        // 3. Find active SOS signals from these users
        const activeSignals = await SOS.find({
            userId: { $in: userIds },
            active: true
        }).populate('userId', 'name phone profileImage');

        return NextResponse.json(activeSignals);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
