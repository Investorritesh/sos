import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(10),
    bloodGroup: z.string().optional(),
    medicalConditions: z.string().optional(),
    homeAddress: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, phone, bloodGroup, medicalConditions, homeAddress } = registerSchema.parse(body);

        await dbConnect();

        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            bloodGroup,
            medicalConditions,
            homeAddress,
        });

        return NextResponse.json({ message: 'User registered successfully', userId: user._id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Error occurred' }, { status: 500 });
    }
}
