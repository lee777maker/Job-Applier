import re
from typing import Dict, List
from patterns import PredictablePatterns

def split_sections(text: str) -> Dict[str, str]:
    """Split CV into sections based on headers"""
    lines = text.split('\n')
    sections = {
        'header': '',
        'experience': '',
        'education': '',
        'skills': '',
        'projects': '',
        'certifications': '',
        'summary': '',
        'languages': '',
        'awards': '',
        'other': ''
    }
    
    current_section = 'header'
    current_content = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check for section header
        for section_name, pattern in PredictablePatterns.SECTION_HEADERS.items():
            if pattern.match(stripped):
                sections[current_section] = '\n'.join(current_content).strip()
                current_content = []
                current_section = section_name
                break
        else:
            current_content.append(line)
    
    sections[current_section] = '\n'.join(current_content).strip()
    return sections


# In sections.py - replace split_entries function
def split_entries(section_text: str, section_type: str = 'experience') -> List[str]:
    """Split section into individual entries with smarter logic"""
    if not section_text:
        return []
    
    lines = section_text.split('\n')
    entries = []
    current_entry = []
    
    # Different patterns for different sections
    if section_type == 'experience':
        # Job entries typically start with a title (capitalized words) 
        # followed by company, then dates
        new_entry_patterns = [
            r'^[A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Lead|Director|Analyst|Consultant|Specialist|Coordinator|Intern)',
            r'^[A-Z][a-zA-Z\s]+(?:at|@)\s+[A-Z]',  # "Role at Company"
        ]
    elif section_type == 'education':
        new_entry_patterns = [
            r'^(?:Bachelor|Master|PhD|B\.|M\.|MBA|BSc|MSc|BA|MA|High School|Diploma|Certificate)',
        ]
    else:
        new_entry_patterns = [r'^\\s*[•\\-*]\\s*']
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if this line starts a new entry
        is_new_entry = any(re.match(p, stripped) for p in new_entry_patterns)
        
        # Also check if line looks like a standalone job title (short, capitalized, no bullets)
        if not is_new_entry and len(stripped) < 60 and stripped[0].isupper() and not stripped.startswith('-') and not stripped.startswith('•'):
            is_new_entry = True
        
        if current_entry and is_new_entry:
            entries.append('\\n'.join(current_entry).strip())
            current_entry = []
        
            current_entry.append(line)
    
        if current_entry:
            entries.append('\\n'.join(current_entry).strip())
    
    return entries or [section_text.strip()]


def extract_date_range(text: str) -> str:
    """Extract date range using regex"""
    match = PredictablePatterns.DATE_RANGE.search(text)
    if match:
        return f"{match.group(1)} - {match.group(2)}"
    
    years = PredictablePatterns.YEAR.findall(text)
    if len(years) >= 2:
        return f"{years[0]} - {years[1]}"
    elif len(years) == 1:
        return years[0]
    
    return ""