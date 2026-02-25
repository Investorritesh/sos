import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById((session.user as any).id);
    return NextResponse.json(user.emergencyContacts);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { name, phone, relationship } = await req.json();

    await dbConnect();
    const user = await User.findById((session.user as any).id);

    if (user.emergencyContacts.length >= 5) {
        return NextResponse.json({ message: 'Maximum 5 contacts allowed' }, { status: 400 });
    }

    user.emergencyContacts.push({ name, phone, relationship });
    await user.save();

    return NextResponse.json(user.emergencyContacts);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('id');

    await dbConnect();
    const user = await User.findById((session.user as any).id);
    user.emergencyContacts = user.emergencyContacts.filter((c: any) => c._id.toString() !== contactId);
    await user.save();

    return NextResponse.json(user.emergencyContacts);
}
