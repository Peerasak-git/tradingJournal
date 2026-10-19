import { NextResponse } from 'next/server';
import { getReviews, saveReviews } from '@/lib/db';
import { Review } from '@/types/review';
import crypto from 'crypto';

export async function GET() {
  const reviews = await getReviews();
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const reviews = await getReviews();
    
    const newReview: Review = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    reviews.push(newReview);
    await saveReviews(reviews);
    
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
  }
}
