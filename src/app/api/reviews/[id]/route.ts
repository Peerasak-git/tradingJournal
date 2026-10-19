import { NextResponse } from 'next/server';
import { getReviews, saveReviews } from '@/lib/db';
import { Review } from '@/types/review';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const reviews = await getReviews();
    const index = reviews.findIndex(r => r.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    const updatedReview: Review = {
      ...reviews[index],
      ...data,
      id // Ensure ID doesn't change
    };
    
    reviews[index] = updatedReview;
    await saveReviews(reviews);
    
    return NextResponse.json(updatedReview);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await getReviews();
    const index = reviews.findIndex(r => r.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    reviews.splice(index, 1);
    await saveReviews(reviews);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
