from typing import Dict, List
from extractors.contact import extract_contact_info
from extractors.sections import split_sections, split_entries, extract_date_range
from extractors import llm


async def extract_cv(text: str) -> Dict:
    """Main extraction orchestration"""
    
    # Step 1: Predictable fields (regex)
    contact = extract_contact_info(text)
    
    # Step 2: Section splitting
    sections = split_sections(text)
    
    # Step 3: Process each section
    
    # Experience
    experiences = []
    for i, entry in enumerate(split_entries(sections['experience'])[:5], 1):
        duration = extract_date_range(entry)
        fields = await llm.extract_fields(entry, llm.EXPERIENCE_FIELDS)
        experiences.append({
            "id": str(i),
            "title": fields["title"],
            "company": fields["company"],
            "duration": duration,
            "description": fields["description"] or entry
        })
    
    # Education
    education = []
    for i, entry in enumerate(split_entries(sections['education'])[:3], 1):
        duration = extract_date_range(entry)
        fields = await llm.extract_fields(entry, llm.EDUCATION_FIELDS)
        education.append({
            "id": str(i),
            "degree": fields["degree"],
            "institution": fields["institution"],
            "field": fields["field"],
            "duration": duration,
            "description": fields["description"] or entry
        })
    
    # Projects
    projects = []
    for i, entry in enumerate(split_entries(sections['projects'])[:5], 1):
        fields = await llm.extract_fields(entry, llm.PROJECT_FIELDS)
        link = __import__('re').search(r'https?://[^\s]+', entry)
        projects.append({
            "id": str(i),
            "name": fields["name"],
            "description": fields["description"] or entry,
            "link": link.group(0) if link else ""
        })
    
    # Certifications
    certifications = []
    for i, entry in enumerate(split_entries(sections['certifications'])[:5], 1):
        date = extract_date_range(entry)
        fields = await llm.extract_fields(entry, llm.CERTIFICATION_FIELDS)
        certifications.append({
            "id": str(i),
            "name": fields["name"],
            "issuer": fields["issuer"],
            "date": date
        })
    
    # Skills
    skills = []
    if sections['skills']:
        try:
            fields = await llm.extract_fields(sections['skills'], llm.SKILL_FIELDS)
            skills_text = fields.get("skills", "")
            if skills_text:
            # Handle both comma-separated and newline-separated
                delimiter = '\\n' if '\\n' in skills_text else ','
                skill_list = [s.strip() for s in skills_text.split(delimiter) if s.strip()]
                for i, name in enumerate(skill_list[:20], 1):
                    skills.append({"id": str(i), "name": name, "level": ""})

        except Exception as e:
            print(f"Skills extraction error: {e}")
        
    # Languages
    languages = []
    for i, entry in enumerate(split_entries(sections['languages'])[:5], 1):
        # Simple extraction - could add LLM if needed
        parts = entry.split('-')
        languages.append({
            "id": str(i),
            "name": parts[0].strip(),
            "proficiency": parts[1].strip() if len(parts) > 1 else ""
        })
    
    # Name extraction (LLM from header or full text)
    name = await llm.extract_fields(sections['header'][:500], llm.NAME_FIELDS)
    if not name["firstName"]:
        name = await llm.extract_fields(text[:500], llm.NAME_FIELDS)
    contact["firstName"] = name["firstName"]
    contact["lastName"] = name["lastName"]
    
    return {
        "contactInfo": contact,
        "experiences": experiences,
        "educations": education,
        "skills": skills,
        "projects": projects,
        "certifications": certifications,
        "languages": languages,
        "rawText": text
    }