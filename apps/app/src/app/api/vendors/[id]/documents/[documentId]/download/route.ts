import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase-service";

// GET /api/vendors/[id]/documents/[documentId]/download - Download a document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    console.log(`GET /api/vendors/${params.id}/documents/${params.documentId}/download - Starting request`);
    
    const vendorId = params.id;
    const documentId = params.documentId;
    
    if (!vendorId || !documentId) {
      return NextResponse.json(
        { error: "Vendor ID and Document ID are required" },
        { status: 400 }
      );
    }
    
    // Check if this is a preview request
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';
    
    console.log("Is preview request:", isPreview);
    
    // Get document to find its path and type
    const { data: document, error: fetchError } = await serviceClient
      .from("vendor_documents")
      .select("file_path, file_type, name")
      .eq("id", documentId)
      .eq("vendor_id", vendorId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching document:", fetchError);
      
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch document: " + fetchError.message },
        { status: 500 }
      );
    }
    
    // Download from storage
    const { data: fileData, error: downloadError } = await serviceClient
      .storage
      .from("vendor-documents")
      .download(document.file_path);
    
    if (downloadError) {
      console.error("Error downloading file from storage:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file: " + downloadError.message },
        { status: 500 }
      );
    }
    
    // Set Content-Disposition based on mode (preview or download)
    const contentDisposition = isPreview 
      ? `inline; filename="${document.name}"` 
      : `attachment; filename="${document.name}"`;
    
    // Create a response with the file content
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": document.file_type,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Error in document download route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 