#!/usr/bin/env python3
"""
Terminal test script for CV extraction
Run: python test_extraction.py
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test CV content
mock_cv = """John Smith
john.smith@email.com | +27 82 123 4567 | linkedin.com/in/johnsmith | github.com/johnsmith

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development.

EXPERIENCE
Senior Software Engineer
TechCorp Inc.
January 2020 - Present
- Led development of microservices architecture
- Managed team of 5 developers

Software Developer
StartupXYZ
June 2017 - December 2019
- Built React frontend applications

EDUCATION
Bachelor of Science in Computer Science
University of Cape Town
2013 - 2016

SKILLS
Python, JavaScript, React, Node.js, Docker

PROJECTS
Portfolio Website - Built with Next.js

CERTIFICATIONS
AWS Certified Solutions Architect - 2021

LANGUAGES
English - Native
"""

def test_regex_patterns():
    """Test regex patterns without dependencies"""
    print("=" * 70)
    print("TEST 1: REGEX PATTERNS")
    print("=" * 70)
    
    import re
    
    # Email pattern
    email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    emails = email_pattern.findall(mock_cv)
    print(f"✅ Email found: {emails[0] if emails else 'NONE'}")
    
    # Phone pattern (South Africa)
    phone_pattern = re.compile(r'(?:\+27|27|0)[\s-]?(?:\d{2})[\s-]?(?:\d{3})[\s-]?(?:\d{4})')
    phones = phone_pattern.findall(mock_cv)
    print(f"✅ Phone found: {phones[0] if phones else 'NONE'}")
    
    # LinkedIn
    linkedin_pattern = re.compile(r'linkedin\.com/in/[a-zA-Z0-9_-]+', re.IGNORECASE)
    linkedin = linkedin_pattern.search(mock_cv)
    print(f"✅ LinkedIn found: {linkedin.group(0) if linkedin else 'NONE'}")
    
    # GitHub
    github_pattern = re.compile(r'github\.com/[a-zA-Z0-9_-]+', re.IGNORECASE)
    github = github_pattern.search(mock_cv)
    print(f"✅ GitHub found: {github.group(0) if github else 'NONE'}")
    
    return True

def test_section_splitting():
    """Test section splitting logic"""
    print("\n" + "=" * 70)
    print("TEST 2: SECTION SPLITTING")
    print("=" * 70)
    
    import re
    
    SECTION_HEADERS = {
        'experience': re.compile(r'^(?:experience|work\s+experience|employment|career\s+history|professional\s+experience|work\s+history)[:\s]*$', re.IGNORECASE),
        'education': re.compile(r'^(?:education|academic|qualifications|academic\s+background|degrees)[:\s]*$', re.IGNORECASE),
        'skills': re.compile(r'^(?:skills|technical\s+skills|technologies|core\s+competencies|expertise)[:\s]*$', re.IGNORECASE),
        'projects': re.compile(r'^(?:projects|personal\s+projects|relevant\s+projects|key\s+projects)[:\s]*$', re.IGNORECASE),
        'certifications': re.compile(r'^(?:certifications|licenses|certs|accreditations|professional\s+certifications)[:\s]*$', re.IGNORECASE),
        'summary': re.compile(r'^(?:summary|professional\s+summary|profile|objective|about)[:\s]*$', re.IGNORECASE),
        'languages': re.compile(r'^(?:languages|language\s+proficiency)[:\s]*$', re.IGNORECASE),
    }
    
    lines = mock_cv.split('\n')
    sections = {k: '' for k in ['header', 'experience', 'education', 'skills', 'projects', 'certifications', 'summary', 'languages', 'other']}
    current_section = 'header'
    current_content = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        matched = False
        for section_name, pattern in SECTION_HEADERS.items():
            if pattern.match(stripped):
                sections[current_section] = '\n'.join(current_content).strip()
                current_content = []
                current_section = section_name
                matched = True
                break
        
        if not matched:
            current_content.append(line)
    
    sections[current_section] = '\n'.join(current_content).strip()
    
    for name, content in sections.items():
        status = "✅" if content else "❌"
        preview = content[:40].replace('\n', ' ') if content else "empty"
        print(f"{status} {name:15} | {preview}...")
    
    return sections

def test_entry_splitting(sections):
    """Test entry splitting within sections"""
    print("\n" + "=" * 70)
    print("TEST 3: ENTRY SPLITTING")
    print("=" * 70)
    
    import re
    
    def split_entries(section_text):
        if not section_text:
            return []
        
        lines = section_text.split('\n')
        entries = []
        current_entry = []
        
        # Patterns that indicate a new job entry
        new_entry_patterns = [
            r'^[A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Lead|Director|Analyst|Consultant|Specialist|Coordinator|Intern)',
            r'^[A-Z][a-zA-Z\s]+(?:at|@)\s+[A-Z]',
        ]
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            
            is_new_entry = any(re.match(p, stripped) for p in new_entry_patterns)
            
            # Also check for standalone title lines
            if not is_new_entry and len(stripped) < 50 and stripped[0].isupper() and not stripped.startswith('-') and not stripped.startswith('•'):
                if not any(c in stripped for c in ['@', '+', 'http', '20', '19']):
                    is_new_entry = True
            
            if current_entry and is_new_entry:
                entries.append('\n'.join(current_entry).strip())
                current_entry = []
            
            current_entry.append(line)
        
        if current_entry:
            entries.append('\n'.join(current_entry).strip())
        
        return entries or [section_text.strip()]
    
    exp_entries = split_entries(sections.get('experience', ''))
    print(f"Experience entries: {len(exp_entries)}")
    for i, entry in enumerate(exp_entries[:3], 1):
        first_line = entry.split('\n')[0][:50]
        print(f"  {i}. {first_line}...")
    
    edu_entries = split_entries(sections.get('education', ''))
    print(f"\nEducation entries: {len(edu_entries)}")
    for i, entry in enumerate(edu_entries[:2], 1):
        first_line = entry.split('\n')[0][:50]
        print(f"  {i}. {first_line}...")
    
    return exp_entries, edu_entries

def test_date_extraction():
    """Test date range extraction"""
    print("\n" + "=" * 70)
    print("TEST 4: DATE EXTRACTION")
    print("=" * 70)
    
    import re
    
    DATE_RANGE = re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-/]+\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|\d{4})[\s\-–—to]+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-/]+\d{2,4}|\d{1,2}[\/\-\.]\d{2,4}|\d{4}|present|current|now)', 
        re.IGNORECASE
    )
    YEAR = re.compile(r'\b(19|20)\d{2}\b')
    
    def extract_date_range(text):
        match = DATE_RANGE.search(text)
        if match:
            return f"{match.group(1)} - {match.group(2)}"
        
        years = YEAR.findall(text)
        if len(years) >= 2:
            return f"{years[0]} - {years[1]}"
        elif len(years) == 1:
            return years[0]
        
        return ""
    
    test_cases = [
        "January 2020 - Present",
        "June 2017 - December 2019",
        "2013 - 2016",
        "No dates here"
    ]
    
    for test in test_cases:
        result = extract_date_range(test)
        status = "✅" if result else "❌"
        print(f"{status} '{test}' -> '{result}'")

async def test_full_extraction():
    """Test full extraction with mocked LLM"""
    print("\n" + "=" * 70)
    print("TEST 5: FULL CV EXTRACTION (MOCKED)")
    print("=" * 70)
    
    # Mock the LLM calls
    class MockLLM:
        async def extract_fields(self, text, fields):
            result = {}
            for key in fields.keys():
                if key == "firstName":
                    result[key] = "John"
                elif key == "lastName":
                    result[key] = "Smith"
                elif key == "title":
                    result[key] = "Senior Software Engineer"
                elif key == "company":
                    result[key] = "TechCorp Inc"
                elif key == "degree":
                    result[key] = "Bachelor of Science"
                elif key == "institution":
                    result[key] = "University of Cape Town"
                elif key == "field":
                    result[key] = "Computer Science"
                elif key == "skills":
                    result[key] = "Python, JavaScript, React, Node.js"
                elif key == "name":
                    result[key] = "Portfolio Website"
                elif key == "description":
                    result[key] = "Built with Next.js"
                else:
                    result[key] = f"Sample {key}"
            return result
    
    # Patch the LLM module
    try:
        import extractors.llm as llm_module
        original_extract = llm_module.extract_fields
        llm_module.extract_fields = MockLLM().extract_fields
        
        from services.cv_extraction import extract_cv
        
        result = await extract_cv(mock_cv)
        
        # Restore original
        llm_module.extract_fields = original_extract
        
        print(f"Contact: {result['contactInfo'].get('firstName', '?')} {result['contactInfo'].get('lastName', '?')}")
        print(f"Email: {result['contactInfo'].get('email', 'N/A')}")
        print(f"Experiences: {len(result.get('experiences', []))}")
        print(f"Education: {len(result.get('education', []))}")
        print(f"Skills: {len(result.get('skills', []))}")
        print(f"Projects: {len(result.get('projects', []))}")
        print(f"Certifications: {len(result.get('certifications', []))}")
        print(f"Languages: {len(result.get('languages', []))}")
        
        # Validation
        print("\n" + "=" * 70)
        print("VALIDATION")
        print("=" * 70)
        
        checks = [
            ("Email extracted", bool(result['contactInfo'].get('email'))),
            ("First name extracted", bool(result['contactInfo'].get('firstName'))),
            ("Last name extracted", bool(result['contactInfo'].get('lastName'))),
            ("Has experiences", len(result.get('experiences', [])) > 0),
            ("Has education", len(result.get('education', [])) > 0),
            ("Has skills", len(result.get('skills', [])) > 0),
            ("Raw text preserved", len(result.get('rawText', '')) > 100),
        ]
        
        passed = sum(1 for _, check in checks if check)
        for name, check in checks:
            status = "✅" if check else "❌"
            print(f"{status} {name}")
        
        print(f"\nScore: {passed}/{len(checks)} ({passed/len(checks)*100:.0f}%)")
        
        if passed == len(checks):
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print("\n⚠️  SOME TESTS FAILED")
        
        return result
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("\n" + "=" * 70)
    print("JOBAPPLIER CV EXTRACTION TEST SUITE")
    print("=" * 70)
    
    # Run synchronous tests
    test_regex_patterns()
    sections = test_section_splitting()
    test_entry_splitting(sections)
    test_date_extraction()
    
    # Run async test
    result = asyncio.run(test_full_extraction())
    
    return result

if __name__ == "__main__":
    main()
