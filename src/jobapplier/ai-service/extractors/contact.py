from typing import Dict
from patterns import PredictablePatterns

def extract_contact_info(text: str) -> Dict:
    """Extract predictable contact fields with regex only"""
    contact = {
        "firstName": "",
        "lastName": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "portfolio": ""
    }
    
    # Email
    emails = PredictablePatterns.EMAIL.findall(text)
    if emails:
        contact["email"] = emails[0].lower()
    
    # Phone
    phones = PredictablePatterns.PHONE.findall(text)
    if phones:
        contact["phone"] = phones[0]
    
    # LinkedIn
    li = PredictablePatterns.LINKEDIN.search(text)
    if li:
        contact["linkedin"] = li.group(0)
    
    # GitHub
    gh = PredictablePatterns.GITHUB.search(text)
    if gh:
        contact["github"] = gh.group(0)
    
    # Portfolio (first non-LI/GH URL)
    for match in PredictablePatterns.PORTFOLIO.finditer(text):
        url = match.group(0)
        if 'linkedin' not in url.lower() and 'github' not in url.lower():
            contact["portfolio"] = url
            break
    
    return contact
def extract_name_from_header(text: str) -> Dict[str, str]:
    """Extract name from the first few lines of CV using regex patterns"""
    lines = text.strip().split('\\n')[:5]  # Check first 5 lines
    
    for line in lines:
        stripped = line.strip()
        # Pattern: 2-3 capitalized words, possibly with hyphens
        # Exclude lines with @, +, http (contact info)
        if ('@' in stripped or '+' in stripped or 'http' in stripped or 
            stripped.lower() in ['curriculum vitae', 'resume', 'cv']):
            continue
            
        # Match patterns like "John Smith", "Mary-Jane Watson", "Jean Luc Picard"
        name_match = re.match(r'^([A-Z][a-zA-Z-]+)\\s+([A-Z][a-zA-Z-]+)(?:\\s+[A-Z][a-zA-Z-]+)?$', stripped)
        if name_match:
            parts = stripped.split()
            return {
                "firstName": parts[0],
                "lastName": ' '.join(parts[1:]) if len(parts) > 1 else ""
            }
    
    return {"firstName": "", "lastName": ""}