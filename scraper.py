#!/usr/bin/env python3
“””
SheVegas Direct Democracy - Agenda Scraper
Monitors Sheboygan municode site for new Common Council agendas
Extracts votable items and generates ballot content
“””

import requests
import json
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import os
import sys

# Configuration

MUNICODE_BASE_URL = “https://sheboygan-wi.municodemeetings.com”
MEETING_TYPE = “Common Council”
CHECK_DAYS_AHEAD = 14  # Look for meetings in next 2 weeks
CACHE_FILE = “last_processed_agenda.json”

class AgendaScraper:
def **init**(self):
self.session = requests.Session()
self.session.headers.update({
‘User-Agent’: ‘SheVegas Direct Democracy Bot/1.0’
})

```
def get_upcoming_meetings(self):
    """Fetch list of upcoming meetings from municode site"""
    try:
        print(f"Fetching meetings from {MUNICODE_BASE_URL}")
        response = self.session.get(MUNICODE_BASE_URL)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        meetings = []
        
        # Parse meeting list (structure varies by site)
        # This will need to be adjusted based on actual site structure
        meeting_elements = soup.find_all(['div', 'article'], class_=re.compile(r'meeting|event'))
        
        for element in meeting_elements:
            meeting = self.parse_meeting_element(element)
            if meeting and self.is_target_meeting(meeting):
                meetings.append(meeting)
        
        print(f"Found {len(meetings)} upcoming {MEETING_TYPE} meetings")
        return meetings
        
    except Exception as e:
        print(f"Error fetching meetings: {e}")
        return []

def parse_meeting_element(self, element):
    """Extract meeting details from HTML element"""
    try:
        # Extract meeting title/type
        title_elem = element.find(['h2', 'h3', 'a'], class_=re.compile(r'title|name'))
        if not title_elem:
            return None
        
        title = title_elem.get_text(strip=True)
        
        # Extract date
        date_elem = element.find(['span', 'time', 'div'], class_=re.compile(r'date|time'))
        date_str = date_elem.get_text(strip=True) if date_elem else ""
        
        # Extract agenda link
        agenda_link = None
        for link in element.find_all('a'):
            link_text = link.get_text(strip=True).lower()
            if 'agenda' in link_text or 'packet' in link_text:
                agenda_link = link.get('href')
                if agenda_link and not agenda_link.startswith('http'):
                    agenda_link = MUNICODE_BASE_URL + agenda_link
                break
        
        return {
            'title': title,
            'date_str': date_str,
            'date': self.parse_date(date_str),
            'agenda_url': agenda_link,
            'element_html': str(element)
        }
        
    except Exception as e:
        print(f"Error parsing meeting element: {e}")
        return None

def parse_date(self, date_str):
    """Parse date string to datetime object"""
    # Common date formats
    formats = [
        '%m/%d/%Y',
        '%m/%d/%y',
        '%B %d, %Y',
        '%b %d, %Y',
        '%Y-%m-%d'
    ]
    
    for fmt in formats:
        try:
            # Extract just the date part (remove time if present)
            date_part = re.search(r'[\d/\-]+|[A-Za-z]+\s+\d+,?\s+\d+', date_str)
            if date_part:
                return datetime.strptime(date_part.group(), fmt)
        except:
            continue
    
    return None

def is_target_meeting(self, meeting):
    """Check if meeting matches our criteria"""
    if not meeting or not meeting.get('date'):
        return False
    
    # Check if it's Common Council
    title = meeting.get('title', '').lower()
    if MEETING_TYPE.lower() not in title:
        return False
    
    # Check if it's in the near future
    days_until = (meeting['date'] - datetime.now()).days
    if days_until < 0 or days_until > CHECK_DAYS_AHEAD:
        return False
    
    # Check if agenda is available
    if not meeting.get('agenda_url'):
        return False
    
    return True

def download_agenda(self, url):
    """Download agenda PDF or HTML"""
    try:
        print(f"Downloading agenda from {url}")
        response = self.session.get(url, timeout=30)
        response.raise_for_status()
        
        content_type = response.headers.get('Content-Type', '')
        
        if 'pdf' in content_type:
            return {'type': 'pdf', 'content': response.content}
        else:
            return {'type': 'html', 'content': response.text}
            
    except Exception as e:
        print(f"Error downloading agenda: {e}")
        return None

def extract_votable_items(self, agenda_content):
    """Extract votable items from agenda"""
    items = []
    
    if agenda_content['type'] == 'html':
        items = self.extract_from_html(agenda_content['content'])
    elif agenda_content['type'] == 'pdf':
        items = self.extract_from_pdf(agenda_content['content'])
    
    print(f"Extracted {len(items)} votable items")
    return items

def extract_from_html(self, html_content):
    """Extract items from HTML agenda"""
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    # Look for numbered items, resolutions, etc.
    # This regex catches common patterns
    patterns = [
        r'(?:Resolution|Ordinance|Motion|Item)\s*(?:#|No\.?)?\s*(\d+)',
        r'(\d+)\.\s+([A-Z][^.]+(?:\.|$))',
    ]
    
    text = soup.get_text()
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            item = {
                'number': match.group(1) if len(match.groups()) >= 1 else 'Unknown',
                'title': match.group(2) if len(match.groups()) >= 2 else match.group(0),
                'raw_text': self.get_context(text, match.start(), 500)
            }
            items.append(item)
    
    return self.deduplicate_items(items)

def extract_from_pdf(self, pdf_content):
    """Extract items from PDF agenda (requires PyPDF2 or similar)"""
    # For now, return empty - will implement PDF parsing
    # This requires installing PyPDF2 or pdfplumber
    print("PDF parsing not yet implemented - will add in next iteration")
    return []

def get_context(self, text, position, length=500):
    """Get surrounding context for a match"""
    start = max(0, position - 100)
    end = min(len(text), position + length)
    return text[start:end].strip()

def deduplicate_items(self, items):
    """Remove duplicate items"""
    seen = set()
    unique = []
    
    for item in items:
        key = (item.get('number'), item.get('title', '')[:50])
        if key not in seen:
            seen.add(key)
            unique.append(item)
    
    return unique

def categorize_item(self, item):
    """Determine category of item"""
    title = item.get('title', '').lower()
    text = item.get('raw_text', '').lower()
    
    if any(word in title or word in text for word in ['budget', 'finance', 'payment', 'contract', 'purchase', 'tif', 'tax']):
        return '💰 Finance'
    elif any(word in title or word in text for word in ['police', 'fire', 'safety', 'emergency']):
        return '🚔 Public Safety'
    elif any(word in title or word in text for word in ['zoning', 'development', 'building', 'property']):
        return '🏗️ Development'
    elif any(word in title or word in text for word in ['park', 'recreation', 'library', 'community']):
        return '🌳 Community'
    else:
        return '📋 General'

def load_processed_cache(self):
    """Load list of already processed agendas"""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_processed_cache(self, data):
    """Save processed agenda to cache"""
    with open(CACHE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def is_already_processed(self, meeting):
    """Check if we've already processed this agenda"""
    cache = self.load_processed_cache()
    meeting_key = f"{meeting['date'].strftime('%Y-%m-%d')}_{meeting['title']}"
    return meeting_key in cache

def mark_as_processed(self, meeting, items):
    """Mark agenda as processed"""
    cache = self.load_processed_cache()
    meeting_key = f"{meeting['date'].strftime('%Y-%m-%d')}_{meeting['title']}"
    cache[meeting_key] = {
        'processed_at': datetime.now().isoformat(),
        'item_count': len(items),
        'meeting_date': meeting['date'].isoformat()
    }
    self.save_processed_cache(cache)

def run(self):
    """Main scraper execution"""
    print(f"=== SheVegas Agenda Scraper Starting at {datetime.now()} ===")
    
    # Get upcoming meetings
    meetings = self.get_upcoming_meetings()
    
    if not meetings:
        print("No upcoming meetings found")
        return None
    
    # Process each meeting
    for meeting in meetings:
        print(f"\nProcessing: {meeting['title']} on {meeting['date']}")
        
        # Check if already processed
        if self.is_already_processed(meeting):
            print("Already processed - skipping")
            continue
        
        # Download agenda
        agenda_content = self.download_agenda(meeting['agenda_url'])
        if not agenda_content:
            continue
        
        # Extract items
        items = self.extract_votable_items(agenda_content)
        
        if not items:
            print("No votable items found")
            continue
        
        # Categorize items
        for item in items:
            item['category'] = self.categorize_item(item)
        
        # Mark as processed
        self.mark_as_processed(meeting, items)
        
        # Return results for ballot generation
        return {
            'meeting': meeting,
            'items': items,
            'found_at': datetime.now().isoformat()
        }
    
    print("\n=== Scraper Complete - No new agendas ===")
    return None
```

def main():
“”“Run the scraper”””
scraper = AgendaScraper()
result = scraper.run()

```
if result:
    # Save results for ballot generator
    output_file = 'agenda_data.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    
    print(f"\n✅ New agenda found! Saved to {output_file}")
    print(f"   Meeting: {result['meeting']['title']}")
    print(f"   Date: {result['meeting']['date']}")
    print(f"   Items: {len(result['items'])}")
    
    # Exit with success code to trigger notification
    sys.exit(0)
else:
    print("\n⏳ No new agendas found")
    sys.exit(1)
```

if **name** == ‘**main**’:
main()