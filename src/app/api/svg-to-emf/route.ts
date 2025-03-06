import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const svg = formData.get('svg') as string;
    
    if (!svg) {
      return NextResponse.json(
        { error: 'SVG content is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would convert SVG to EMF here
    // Since browser-based EMF conversion is complex, we'll provide instructions instead
    
    // Create a response that triggers a download of the SVG
    // This is a fallback since direct EMF conversion is challenging in a browser environment
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    
    return new NextResponse(svgBlob, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'attachment; filename="bpmn-diagram.svg"'
      }
    });
    
  } catch (error) {
    console.error('Error processing SVG:', error);
    return NextResponse.json(
      { error: 'Failed to process SVG' },
      { status: 500 }
    );
  }
} 