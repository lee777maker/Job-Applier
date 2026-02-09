from pydantic import BaseModel
from typing import List

class ContactInfo(BaseModel):
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""

class Experience(BaseModel):
    id: str = ""
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""

class Education(BaseModel):
    id: str = ""
    degree: str = ""
    institution: str = ""
    field: str = ""
    duration: str = ""
    description: str = ""

class Project(BaseModel):
    id: str = ""
    name: str = ""
    description: str = ""
    link: str = ""

class Certification(BaseModel):
    id: str = ""
    name: str = ""
    issuer: str = ""
    date: str = ""

class Skill(BaseModel):
    id: str = ""
    name: str = ""
    level: str = ""

class Language(BaseModel):
    id: str = ""
    name: str = ""
    proficiency: str = ""

class CVExtractedData(BaseModel):
    contactInfo: ContactInfo
    experiences: List[Experience]
    education: List[Education]
    skills: List[Skill]
    projects: List[Project]
    certifications: List[Certification]
    languages: List[Language]
    rawText: str