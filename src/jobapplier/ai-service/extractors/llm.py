import json
from typing import Dict
from openai import AsyncOpenAI
import config

client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

EXTRACTION_PROMPT = """Extract ONLY the requested fields from this CV text.

Return ONLY valid JSON with these exact fields: {fields}

Text:
{text}

Format: {{{structure}}}"""

async def extract_fields(text: str, fields: Dict[str, str]) -> Dict[str, str]:
    """Use LLM to extract unpredictable fields"""
    if not text or not text.strip():
        return {k: "" for k in fields.keys()}
    
    structure = ', '.join([f'"{k}": ""' for k in fields.keys()])
    field_desc = ', '.join([f"{k} ({v})" for k, v in fields.items()])
    
    prompt = EXTRACTION_PROMPT.format(
        fields=field_desc,
        text=text[:1500],
        structure=structure
    )
    
    try:
        response = await client.chat.completions.create(
            model=config.DEFAULT_LLM_MODEL,
            messages=[
                {"role": "system", "content": "Extract CV info. Return only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return {k: result.get(k, "") for k in fields.keys()}
        
    except Exception as e:
        print(f"LLM extraction failed: {e}")
        return {k: "" for k in fields.keys()}


# Field definitions for different section types
EXPERIENCE_FIELDS = {
    "title": "Job title/role",
    "company": "Company name",
    "description": "Full description as written"
}

EDUCATION_FIELDS = {
    "degree": "Degree name",
    "institution": "School/university name",
    "field": "Field of study",
    "description": "Additional details"
}

PROJECT_FIELDS = {
    "name": "Project name",
    "description": "Full description"
}

CERTIFICATION_FIELDS = {
    "name": "Certification name",
    "issuer": "Issuing organization"
}

NAME_FIELDS = {
    "firstName": "First name",
    "lastName": "Last name"
}

SKILL_FIELDS = {
    "skills": "Comma-separated list of all skills"
}