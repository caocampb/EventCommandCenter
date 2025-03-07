import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { VendorDocument, VendorDocumentDbRow } from "@/types/vendor";
import { z } from "zod";

// Supabase service role client for bypassing RLS
const SUPABASE_URL = "http://127.0.0.1:55321";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const serviceRoleClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// Document schema for validation
const documentSchema = z.object({
  name: z.string().min(1, "Filename is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().int().positive("File size must be positive"),
  fileContent: z.string().min(1, "File content is required") // Base64 encoded file content
});

type DocumentUploadBody = z.infer<typeof documentSchema>;

// GET /api/vendors/[id]/documents - Get all documents for a vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/vendors/${params.id}/documents - Starting request`);
    
    const vendorId = params.id;
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch documents for this vendor
    const { data, error } = await serviceRoleClient
      .from("vendor_documents")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching vendor documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch vendor documents: " + error.message },
        { status: 500 }
      );
    }
    
    // Transform database rows to camelCase
    const documents: VendorDocument[] = data.map((doc: VendorDocumentDbRow) => ({
      id: doc.id,
      vendorId: doc.vendor_id,
      name: doc.name,
      filePath: doc.file_path,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));
    
    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error("Error in vendor documents GET route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST /api/vendors/[id]/documents - Upload a document for a vendor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`POST /api/vendors/${params.id}/documents - Starting request`);
    
    const vendorId = params.id;
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Check if vendor exists
    const { data: vendorData, error: vendorError } = await serviceRoleClient
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .single();
    
    if (vendorError || !vendorData) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate the request data
    const validationResult = documentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, fileType, fileSize, fileContent } = validationResult.data;
    
    // Get file buffer from base64
    const fileBuffer = Buffer.from(
      fileContent.replace(/^data:.*?;base64,/, ""),
      "base64"
    );
    
    // Upload to Supabase Storage
    const filePath = `${vendorId}/${Date.now()}_${name}`;
    const { data: uploadData, error: uploadError } = await serviceRoleClient
      .storage
      .from("vendor-documents")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });
    
    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }
    
    // Create document record in database
    const { data: document, error: documentError } = await serviceRoleClient
      .from("vendor_documents")
      .insert({
        vendor_id: vendorId,
        name: name,
        file_path: uploadData.path,
        file_type: fileType,
        file_size: fileSize
      })
      .select()
      .single();
    
    if (documentError) {
      console.error("Error creating document record:", documentError);
      
      // Try to delete the uploaded file if the database insert fails
      await serviceRoleClient
        .storage
        .from("vendor-documents")
        .remove([uploadData.path]);
      
      return NextResponse.json(
        { error: "Failed to create document record: " + documentError.message },
        { status: 500 }
      );
    }
    
    // Transform to camelCase
    const result: VendorDocument = {
      id: document.id,
      vendorId: document.vendor_id,
      name: document.name,
      filePath: document.file_path,
      fileType: document.file_type,
      fileSize: document.file_size,
      createdAt: document.created_at,
      updatedAt: document.updated_at
    };
    
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("Error in vendor documents POST route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id]/documents?documentId=123 - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/vendors/${params.id}/documents - Starting request`);
    
    const vendorId = params.id;
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }
    
    // Get document ID from query params
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required as a query parameter" },
        { status: 400 }
      );
    }
    
    // Get document to find its path
    const { data: document, error: fetchError } = await serviceRoleClient
      .from("vendor_documents")
      .select("file_path")
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
    
    // Delete from storage
    const { error: storageError } = await serviceRoleClient
      .storage
      .from("vendor-documents")
      .remove([document.file_path]);
    
    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete from database
    const { error: dbError } = await serviceRoleClient
      .from("vendor_documents")
      .delete()
      .eq("id", documentId)
      .eq("vendor_id", vendorId);
    
    if (dbError) {
      console.error("Error deleting document from database:", dbError);
      return NextResponse.json(
        { error: "Failed to delete document: " + dbError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in vendor documents DELETE route:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 