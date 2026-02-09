from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from models import CVExtractedData
from services.cv_extraction import extract_cv
import os

app = FastAPI(title="JobApplier AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "service": "ai-service", "timestamp": datetime.now().isoformat()}


async def extract_file_text(file: UploadFile) -> str:
    """Extract text from PDF, DOCX, or TXT"""
    # Reset file pointer to beginning (critical fix!)
    await file.seek(0)
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        from pdfminer.high_level import extract_text
        from io import BytesIO
        return extract_text(BytesIO(content))
    
    elif file.filename.endswith('.docx'):
        import docx
        from io import BytesIO
        doc = docx.Document(BytesIO(content))
        return "\n".join([p.text for p in doc.paragraphs])
    
    else:  # TXT or other text files
        return content.decode('utf-8', errors='ignore')


@app.post("/agents/extract-cv")
async def extract_cv_endpoint(file: UploadFile = File(...)):
    """Extract CV data from uploaded file"""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
        file_ext = os.path.splitext(file.filename.lower())[1]
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Extract text from file
        text = await extract_file_text(file)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from file. Please upload a valid CV."
            )
        
        # Extract structured data
        result = await extract_cv(text)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    finally:
        await file.close()


@app.post("/agents/autofill")
async def autofill_endpoint(text_content: str = Form(...)):
    """Autofill profile from pasted text"""
    try:
        if not text_content or len(text_content.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Please provide more text content (at least 50 characters)"
            )
        
        result = await extract_cv(text_content)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
       raise HTTPException(status_code=500, detail=f"Autofill failed: {str(e)}")