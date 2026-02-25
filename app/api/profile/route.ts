import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        await dbConnect();
        const user = await User.findById((session.user as any).id).select('-password');
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, phone, bloodGroup, medicalConditions, homeAddress, workAddress } = body;

        await dbConnect();
        const user = await User.findByIdAndUpdate(
            (session.user as any).id,
            { name, phone, bloodGroup, medicalConditions, homeAddress, workAddress },
            { new: true }
        ).select('-password');

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
