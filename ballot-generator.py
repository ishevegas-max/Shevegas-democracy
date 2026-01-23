#!/usr/bin/env python3
“””
SheVegas Direct Democracy - Ballot Generator
Takes extracted agenda items and generates ballot HTML
“””

import json
import os
from datetime import datetime
from pathlib import Path

BALLOT_TEMPLATE = “””

<!-- Ballot Item {number} -->

<article class="ballot-item">
    <div class="item-header">
        <h3>Item {number}: {title}</h3>
        <span class="item-category">{category}</span>
    </div>

```
<div class="item-summary">
    <p><strong>What's being decided:</strong> {summary}</p>
    
    {money_section}
    
    <p><strong>Context:</strong> {context}</p>
    
    <p><strong>Key question:</strong> {key_question}</p>
</div>

<div class="audio-explainer">
    <p>🎙️ <strong>Listen to Mike's explanation:</strong></p>
    <audio controls>
        <source src="audio/item{number}-{slug}.mp3" type="audio/mpeg">
        Your browser does not support audio playback.
    </audio>
    <span class="audio-duration">Recording needed</span>
</div>

<div class="vote-buttons">
    <button class="vote-btn approve" data-item="{number}" data-vote="approve">
        ✅ Approve
    </button>
    <button class="vote-btn deny" data-item="{number}" data-vote="deny">
        ❌ Deny
    </button>
    <button class="vote-btn abstain" data-item="{number}" data-vote="abstain">
        ⚪ Abstain
    </button>
</div>

<div class="live-results" id="results-{number}">
    <div class="results-bar">
        <div class="bar-segment approve" style="width: 0%"></div>
        <div class="bar-segment deny" style="width: 0%"></div>
    </div>
    <div class="results-numbers">
        <span class="approve-count">Approve: <strong>0</strong></span>
        <span class="deny-count">Deny: <strong>0</strong></span>
        <span class="abstain-count">Abstain: <strong>0</strong></span>
        <span class="total-votes">Total: <strong>0</strong> votes</span>
    </div>
</div>
```

</article>
"""

class BallotGenerator:
def **init**(self):
self.agenda_file = ‘agenda_data.json’
self.output_file = ‘generated_ballot.html’

```
def load_agenda_data(self):
    """Load extracted agenda data"""
    if not os.path.exists(self.agenda_file):
        print(f"No agenda data found at {self.agenda_file}")
        return None
    
    with open(self.agenda_file, 'r') as f:
        return json.load(f)

def generate_summary(self, item):
    """Generate plain-English summary from item data"""
    # For now, use raw text - in future, could use AI to enhance
    title = item.get('title', 'Unknown item')
    raw_text = item.get('raw_text', '')
    
    # Try to extract a summary sentence
    sentences = raw_text.split('.')
    summary = sentences[0] if sentences else title
    
    # Clean up
    summary = summary.strip()
    if len(summary) > 300:
        summary = summary[:300] + "..."
    
    return summary

def extract_money_info(self, item):
    """Try to find dollar amounts in item text"""
    import re
    
    text = item.get('raw_text', '')
    
    # Look for dollar amounts
    money_patterns = [
        r'\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|thousand|M|K))?',
        r'[\d,]+(?:\.\d{2})?\s*(?:million|thousand|dollars)'
    ]
    
    amounts = []
    for pattern in money_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        amounts.extend(matches)
    
    if amounts:
        # Return first significant amount found
        return amounts[0]
    
    return None

def generate_key_question(self, item, money=None):
    """Generate a key question for voters"""
    title = item.get('title', '').lower()
    
    # Template questions based on type
    if 'approve' in title or 'authorization' in title:
        base = "Should this be approved?"
    elif 'contract' in title or 'agreement' in title:
        base = "Should the city enter into this contract?"
    elif 'ordinance' in title or 'amendment' in title:
        base = "Should this ordinance be adopted?"
    elif 'appointment' in title:
        base = "Should this appointment be confirmed?"
    else:
        base = "Should the council approve this item?"
    
    if money:
        base += f" (Involves {money})"
    
    return base

def create_slug(self, title):
    """Create URL-friendly slug from title"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:50]  # Limit length

def generate_ballot_item(self, item, number):
    """Generate HTML for a single ballot item"""
    money = self.extract_money_info(item)
    money_section = f'<p><strong>Money involved:</strong> {money}</p>' if money else ''
    
    summary = self.generate_summary(item)
    context = "Review the full agenda packet for complete details."
    key_question = self.generate_key_question(item, money)
    slug = self.create_slug(item.get('title', f'item-{number}'))
    
    return BALLOT_TEMPLATE.format(
        number=number,
        title=item.get('title', 'Unknown Item'),
        category=item.get('category', '📋 General'),
        summary=summary,
        money_section=money_section,
        context=context,
        key_question=key_question,
        slug=slug
    )

def generate_ballot_header(self, meeting_data):
    """Generate ballot header section"""
    meeting_date = datetime.fromisoformat(meeting_data['date'])
    
    return f"""
```

<div class="ballot-header">
    <h2>Current Ballot</h2>
    <div class="ballot-meta">
        <span class="meeting-date">📅 {meeting_data['title']}: {meeting_date.strftime('%A, %b %d, %Y @ %I:%M%p')}</span>
        <span class="voting-status open">✅ Voting Open</span>
    </div>
</div>

<div class="ballot-intro">
    <p><strong>How it works:</strong> Review each item the council will vote on. Cast your vote. We'll publish results before the meeting and compare with how council actually votes.</p>
    <p class="emphasis">This is citizen input, not official voting. But transparency creates accountability.</p>
    <p><strong>⚠️ Audio explanations needed:</strong> Mike still needs to record audio for each item. Check back soon or vote based on the text summaries.</p>
</div>
"""

```
def generate_full_ballot(self, data):
    """Generate complete ballot HTML"""
    meeting = data['meeting']
    items = data['items']
    
    # Generate header
    html_parts = [self.generate_ballot_header(meeting)]
    
    # Generate each item
    html_parts.append('<div class="ballot-items">')
    for idx, item in enumerate(items, start=1):
        html_parts.append(self.generate_ballot_item(item, idx))
    html_parts.append('</div>')
    
    # Add footer note
    html_parts.append("""
```

<div class="ballot-footer">
    <p>📋 <strong>Generated automatically</strong> from council agenda. Mike will review, add context, and record audio explanations.</p>
    <p>Full agenda packet: <a href="{agenda_url}" target="_blank">View on MunicodeMeetings</a></p>
</div>
""".format(agenda_url=meeting['agenda_url']))

```
    return '\n'.join(html_parts)

def generate_audio_checklist(self, data):
    """Generate checklist for recording audio"""
    items = data['items']
    meeting_date = datetime.fromisoformat(data['meeting']['date'])
    
    checklist = f"""
```

# Audio Recording Checklist

## Meeting: {data[‘meeting’][‘title’]} - {meeting_date.strftime(’%A, %B %d, %Y’)}

Record audio explanations for each item (2-5 minutes each):

“””
for idx, item in enumerate(items, start=1):
slug = self.create_slug(item.get(‘title’, f’item-{number}’))
checklist += f”””

### Item {idx}: {item.get(‘title’)}

- [ ] Record audio explanation
- [ ] Save as: `audio/item{idx}-{slug}.mp3`
- [ ] Upload to repo
- [ ] Test playback

**What to cover:**

- What’s actually being decided
- Money involved (if any)
- Why it matters to Sheboygan
- Your analysis/perspective

“””

```
    return checklist

def run(self):
    """Main generator execution"""
    print("=== SheVegas Ballot Generator Starting ===")
    
    # Load agenda data
    data = self.load_agenda_data()
    if not data:
        print("No agenda data to process")
        return False
    
    print(f"Generating ballot for: {data['meeting']['title']}")
    print(f"Items to process: {len(data['items'])}")
    
    # Generate ballot HTML
    ballot_html = self.generate_full_ballot(data)
    
    # Save to file
    with open(self.output_file, 'w') as f:
        f.write(ballot_html)
    
    print(f"✅ Ballot HTML saved to: {self.output_file}")
    
    # Generate audio checklist
    checklist = self.generate_audio_checklist(data)
    checklist_file = 'audio_checklist.md'
    with open(checklist_file, 'w') as f:
        f.write(checklist)
    
    print(f"✅ Audio checklist saved to: {checklist_file}")
    
    # Generate summary
    print("\n" + "="*50)
    print("NEXT STEPS:")
    print("="*50)
    print(f"1. Review generated ballot: {self.output_file}")
    print(f"2. Record audio per checklist: {checklist_file}")
    print(f"3. Copy ballot HTML into index.html (replace ballot-items section)")
    print(f"4. Upload audio files to /audio/ directory")
    print(f"5. Commit and push to GitHub")
    print(f"6. Vercel auto-deploys in 30 seconds")
    print("="*50)
    
    return True
```

def main():
“”“Run the generator”””
generator = BallotGenerator()
success = generator.run()

```
if success:
    print("\n✅ Ballot generation complete!")
    return 0
else:
    print("\n❌ Ballot generation failed")
    return 1
```

if **name** == ‘**main**’:
import sys
sys.exit(main())