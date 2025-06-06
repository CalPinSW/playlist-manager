import { NextResponse } from 'next/server';
import { withAuth } from '../withAuth';

const secretGET = async function shows() {
  try {
    return NextResponse.json({ message: "Shows fetched successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(secretGET);
