import re

class PredictablePatterns:
    """Only extract what regex can reliably predict"""
    
    EMAIL = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    
    PHONE = re.compile(r'(?:\+27|27|0)[\s-]?(?:\d{2})[\s-]?(?:\d{3})[\s-]?(?:\d{4})')
    
    LINKEDIN = re.compile(r'linkedin\.com/in/[a-zA-Z0-9_-]+', re.IGNORECASE)
    GITHUB = re.compile(r'github\.com/[a-zA-Z0-9_-]+', re.IGNORECASE)
    PORTFOLIO = re.compile(r'(?:https?://)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|co\.za|dev|io)[^\s]*', re.IGNORECASE)
    
    DATE_RANGE = re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-/]+\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|\d{4})[\s\-–—to]+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-/]+\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|\d{4}|present|current|now)', 
        re.IGNORECASE
    )
    YEAR = re.compile(r'\b(19|20)\d{2}\b')
    
    SECTION_HEADERS = {
        'experience': re.compile(r'^(?:experience|work\s+experience|employment|career\s+history|professional\s+experience|work\s+history)[:\s]*$', re.IGNORECASE),
        'education': re.compile(r'^(?:education|academic|qualifications|academic\s+background|degrees)[:\s]*$', re.IGNORECASE),
        'skills': re.compile(r'^(?:skills|technical\s+skills|technologies|core\s+competencies|expertise)[:\s]*$', re.IGNORECASE),
        'projects': re.compile(r'^(?:projects|personal\s+projects|relevant\s+projects|key\s+projects)[:\s]*$', re.IGNORECASE),
        'certifications': re.compile(r'^(?:certifications|licenses|certs|accreditations|professional\s+certifications)[:\s]*$', re.IGNORECASE),
        'summary': re.compile(r'^(?:summary|professional\s+summary|profile|objective|about)[:\s]*$', re.IGNORECASE),
        'languages': re.compile(r'^(?:languages|language\s+proficiency)[:\s]*$', re.IGNORECASE),
        'awards': re.compile(r'^(?:awards|honors|achievements|recognitions)[:\s]*$', re.IGNORECASE),
    }
    