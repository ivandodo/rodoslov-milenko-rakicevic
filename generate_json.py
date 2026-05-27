import json
import re

with open("raw_tables.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

# Cyrillic to Latin transliteration dictionary
CYR_TO_LAT = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E', 'Ж': 'Ž', 'З': 'Z',
    'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'Ć', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
    'Ч': 'Č', 'Џ': 'Dž', 'Ш': 'Š',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e', 'ж': 'ž', 'з': 'z',
    'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'ć', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'č', 'џ': 'dž', 'ш': 'š'
}

def transliterate(text):
    if not text:
        return text
    return "".join(CYR_TO_LAT.get(char, char) for char in text)

# Helper to clean mixed alphabet words
def clean_mixed_chars(text):
    if not text:
        return text
    # e.g., 'Бeoград' -> 'Београд' (replacing latin 'e', 'o' inside cyrillic word)
    # Or vice versa. Let's do standard transliteration to Latin which normalizes everything!
    return transliterate(text)

people = []
person_id_counter = 1

def get_next_id():
    global person_id_counter
    id_str = f"p{person_id_counter}"
    person_id_counter += 1
    return id_str

# Root couple
root_id = "p0"
root_raw = "M ИЛЕНКО РАКИЋЕВИЋ (1900.-1984.) супруга Јелена (1895.-1963.) рођена Милић, Стубал, Александровац венчани: 1917. место боравка: Лепенац, Брус"
people.append({
    "id": root_id,
    "raw_text": root_raw,
    "generation": 0,
    "parent_id": None,
    "children_ids": []
})

active_persons = [None] * 6
active_persons[0] = people[0]

def is_continuation(text, gen):
    if not text:
        return False
    t = text.strip()
    if not t:
        return False
    
    first_char = t[0]
    if first_char in "(-–.0123456789":
        return True
    if first_char.islower():
        return True
    if first_char in "абвгдђежзијклљмнњопрстћуфхцчџш":
        return True
    
    lower_t = t.lower()
    if lower_t.startswith("место") or lower_t.startswith("mesto") or lower_t.startswith("венчани") or lower_t.startswith("супруг"):
        return True
        
    return False

# 1. Parse tables sequentially and build the tree structure
for page_info in raw_data:
    page_num = page_info["page"]
    tables = page_info["tables"]
    if not tables:
        continue
    
    table = tables[0]
    start_idx = 0
    if len(table) > 0:
        first_row = table[0]
        if first_row[0] == "Рб" or "колено" in "".join([str(c) for c in first_row]):
            start_idx = 1
            
    for r_idx in range(start_idx, len(table)):
        row = table[r_idx]
        clean_row = [cell.strip() if cell is not None else "" for cell in row]
        
        if not any(clean_row):
            continue
            
        for c in range(1, 6):
            cell_text = clean_row[c]
            if not cell_text:
                continue
                
            if is_continuation(cell_text, c) and active_persons[c] is not None:
                active_persons[c]["raw_text"] += " " + cell_text
            else:
                existing_person = None
                if c == 1:
                    # check for repeated branch header
                    name_match = re.match(r"^([\u0400-\u04FFa-zA-ZžćčšđŽĆČŠĐ]+)", cell_text)
                    if name_match:
                        first_name = name_match.group(1).upper()
                        for p in people:
                            if p["generation"] == 1:
                                p_name_match = re.match(r"^([\u0400-\u04FFa-zA-ZžćčšđŽĆČŠĐ]+)", p["raw_text"])
                                if p_name_match and p_name_match.group(1).upper() == first_name:
                                    existing_person = p
                                    break
                
                if existing_person:
                    active_persons[1] = existing_person
                    for d in range(2, 6):
                        active_persons[d] = None
                else:
                    p_id = get_next_id()
                    parent = active_persons[c-1]
                    parent_id = parent["id"] if parent else None
                    
                    new_p = {
                        "id": p_id,
                        "raw_text": cell_text,
                        "generation": c,
                        "parent_id": parent_id,
                        "children_ids": []
                    }
                    people.append(new_p)
                    if parent:
                        parent["children_ids"].append(p_id)
                        
                    active_persons[c] = new_p
                    for d in range(c + 1, 6):
                        active_persons[d] = None

# Helper to calculate parent-child relationships and surnames
def calculate_gender_and_surname(p):
    text = p["raw_text"].strip()
    text_latin = transliterate(text)
    
    # 1. Name parsing
    name_part = text
    parenthesis_match = re.search(r'\(([^)]+)\)?', text)
    if parenthesis_match:
        name_part = text[:parenthesis_match.start()].strip()
    
    first_name_sr = name_part
    nickname_sr = None
    
    name_split = re.split(r'\s*[-–]\s*', name_part)
    if len(name_split) >= 2:
        second_part = name_split[1].strip()
        if len(second_part.split()) == 1 and second_part[0].isupper() and "живео" not in second_part and "mesto" not in second_part:
            first_name_sr = name_split[0].strip()
            nickname_sr = second_part
        elif "живео" in name_part or "mesto" in name_part:
            first_name_sr = name_split[0].strip()
            
    words = first_name_sr.split()
    if len(words) >= 2:
        first_name_sr = words[0]
        # if the second word is capitalized, it could be last name (like MILENKO RAKIĆEVIĆ)
        if words[1][0].isupper():
            # but usually it's just first name in standard rows, except for root Milenko
            pass
            
    # Manual overrides / corrections
    if first_name_sr == "Вања" and p["parent_id"] == "p78":
        first_name_sr = "Вана"
    if "БОСАНКА" in first_name_sr:
        first_name_sr = "Босанка"
        nickname_sr = "Боса"
            
    first_name_en = transliterate(first_name_sr)
    nickname_en = transliterate(nickname_sr)
    
    # Specific case for Milenko
    if p["id"] == "p0":
        first_name_sr = "Миленко"
        first_name_en = "Milenko"
        nickname_sr = None
        nickname_en = None
    
    # 2. Extract birth/death years
    birth_year, death_year = None, None
    birth_date, death_date = None, None
    is_alive = True
    
    if parenthesis_match:
        paren_content = parenthesis_match.group(1).strip()
        dates = re.findall(r'\b(\d{2}\.\d{2}\.\d{4})\b', paren_content)
        if len(dates) >= 1:
            birth_date = dates[0]
            birth_year = int(birth_date.split('.')[-1])
            if len(dates) >= 2:
                death_date = dates[1]
                death_year = int(death_date.split('.')[-1])
                is_alive = False
        else:
            paren_content_clean = re.sub(r'19261', '1926', paren_content)
            years_clean = re.findall(r'\b(\d{4})\b', paren_content_clean)
            if len(years_clean) >= 1:
                birth_year = int(years_clean[0])
                if '-' in paren_content or '–' in paren_content:
                    if len(years_clean) >= 2:
                        death_year = int(years_clean[1])
                        is_alive = False
                    elif re.search(r'[-–]\s*$', paren_content) or re.search(r'[-–]\s*\b', paren_content) == None:
                        is_alive = True
                else:
                    is_alive = True
            elif paren_content_clean.isdigit():
                birth_year = int(paren_content_clean)
                is_alive = True
    
    # If no birth year could be extracted (e.g. Aleksandar page 9 row 12 which was 'Александар (2023.')
    if not birth_year and "2023" in text:
        birth_year = 2023
        is_alive = True
        
    # Heuristic for is_alive based on birth year
    if birth_year and birth_year < 1920:
        is_alive = False
    if death_year:
        is_alive = False
        
    # 3. Extract spouses
    spouses = []
    spouse_pattern = r'\b(?:прва|друга|трећа|prva|druga|treća|1\.|2\.)?\s*(?:супруга|супруг|supruga|suprug)\b'
    matches = list(re.finditer(spouse_pattern, text, re.IGNORECASE))
    
    spouse_segments = []
    if len(matches) > 0:
        for i in range(len(matches)):
            start = matches[i].start()
            end = matches[i+1].start() if i + 1 < len(matches) else len(text)
            spouse_segments.append(text[start:end])
            
    for s_idx, seg in enumerate(spouse_segments):
        # Determine spouse details
        is_sp_female = "suprug" not in seg.lower() and "супруг" not in seg.lower()
        sp_gender = "female" if is_sp_female else "male"
        
        clean_seg = re.sub(r'^(?:прва|друга|трећа|prva|druga|treća|1\.|2\.)?\s*(?:супруга|супруг|supruga|suprug)\b\s*(?::)?', '', seg, flags=re.IGNORECASE).strip()
        
        sp_name_part = clean_seg
        sp_paren_match = re.search(r'\(([^)]+)\)', clean_seg)
        if sp_paren_match:
            sp_name_part = clean_seg[:sp_paren_match.start()].strip()
            
        sp_first_name_sr = sp_name_part
        sp_last_name_sr = None
        
        sp_words = sp_first_name_sr.split()
        if len(sp_words) >= 2:
            sp_first_name_sr = sp_words[0]
            if sp_words[1][0].isupper() and sp_words[1].lower() not in ["из", "iz", "рођена", "rođena"]:
                sp_last_name_sr = sp_words[1]
                
        sp_birth_year, sp_death_year = None, None
        sp_is_alive = True
        
        if sp_paren_match:
            sp_paren_content = sp_paren_match.group(1).strip()
            sp_dates = re.findall(r'\b(\d{2}\.\d{2}\.\d{4})\b', sp_paren_content)
            if len(sp_dates) >= 1:
                sp_birth_year = int(sp_dates[0].split('.')[-1])
                if len(sp_dates) >= 2:
                    sp_death_year = int(sp_dates[1].split('.')[-1])
                    sp_is_alive = False
            else:
                sp_years = re.findall(r'\b(\d{4})\b', sp_paren_content)
                if len(sp_years) >= 1:
                    sp_birth_year = int(sp_years[0])
                    if len(sp_years) >= 2:
                        sp_death_year = int(sp_years[1])
                        sp_is_alive = False
                        
        if sp_birth_year and sp_birth_year < 1920:
            sp_is_alive = False
        if sp_death_year:
            sp_is_alive = False
            
        sp_maiden_sr = None
        sp_maiden_match = re.search(r'\b(?:рођена|рођ|roђена|rođ|devojačko|девојачко)\s+([\u0400-\u04FFa-zA-ZžćčšđŽĆČŠĐ]+)', clean_seg, re.IGNORECASE)
        if sp_maiden_match:
            sp_maiden_sr = sp_maiden_match.group(1).strip()
            
        # extract last name for male spouse if still None
        if not sp_last_name_sr and sp_gender == "male":
            after_paren = clean_seg[sp_paren_match.end():].strip() if sp_paren_match else clean_seg
            after_words = after_paren.split()
            if after_words:
                cand = after_words[0].strip(".,;")
                if cand and cand[0].isupper() and cand.lower() not in ["из", "iz", "венчани", "venčani", "место", "mesto", "рођена", "rođena", "удата", "udata"]:
                    sp_last_name_sr = cand
                    
        # Extract spouse origin
        sp_origin_sr = None
        sp_orig_match = re.search(r'\b(?:из|iz)\s+([\u0400-\u04FFa-zA-ZžćčšđŽĆČŠĐ\s\-,]+?)(?:\bвенчани\b|\bvenčani\b|\bmesto\b|\bместо\b|\bод\b|\bod\b|$|\.)', clean_seg, re.IGNORECASE)
        if sp_orig_match:
            sp_origin_sr = sp_orig_match.group(1).strip()
        else:
            if sp_maiden_match:
                after_maiden = clean_seg[sp_maiden_match.end():].strip()
                parts = re.split(r'[,;\.\s]+\b(?:венчани|venčani|mesto|место|od|од)\b', after_maiden, flags=re.IGNORECASE)
                cand = parts[0].strip(" ,;.")
                if cand:
                    cand_words = cand.split()
                    if cand_words and cand_words[0][0].isupper() and cand_words[0].lower() not in ["венчани", "venčani"]:
                        sp_origin_sr = cand
                        
        sp_marriage_year = None
        sp_m_match = re.search(r'\b(?:венчани|venčani)\b(?:\s*:\s*)?\s*(\d{4})', clean_seg, re.IGNORECASE)
        if sp_m_match:
            sp_marriage_year = int(sp_m_match.group(1))
            
        sp_first_name_en = transliterate(sp_first_name_sr)
        sp_last_name_en = transliterate(sp_last_name_sr)
        sp_maiden_en = transliterate(sp_maiden_sr)
        sp_origin_en = transliterate(sp_origin_sr)
        
        sp_notes = clean_mixed_chars(seg.strip())
        
        sp_info = {
            "first_name_sr": sp_first_name_sr,
            "last_name_sr": sp_last_name_sr,
            "maiden_name_sr": sp_maiden_sr,
            "first_name_en": sp_first_name_en,
            "last_name_en": sp_last_name_en,
            "maiden_name_en": sp_maiden_en,
            "gender": sp_gender,
            "birth_year": sp_birth_year,
            "death_year": sp_death_year,
            "is_alive": sp_is_alive,
            "origin_sr": sp_origin_sr,
            "origin_en": sp_origin_en,
            "marriage_year": sp_marriage_year,
            "raw_text": sp_notes
        }
        spouses.append(sp_info)
        
    # 4. Gender inference
    gender = "male"
    if spouses:
        # if spouse is female, person is male; if spouse is male, person is female
        gender = "male" if spouses[0]["gender"] == "female" else "female"
    else:
        # Heuristics based on udata/udato
        if "удата" in text.lower() or "удато" in text.lower() or "udata" in text.lower() or "udato" in text.lower():
            gender = "female"
        else:
            # check name ending
            if first_name_sr.endswith("а") or first_name_sr.endswith("a"):
                # standard Serbian female names, but check for male exceptions
                if first_name_en in ["Kosta", "Aleksa", "Tadija", "Andrija", "Vula", "Aca", "Peđa", "Laza", "Coca", "Raja"]:
                    gender = "male"
                else:
                    gender = "female"
            else:
                gender = "male"
                
    # 5. Extract Residence
    residence_sr = None
    res_match = re.search(r'(?:mesto\s+boravka|место\s+боравка|местоборавка)\s*:\s*([^;,\.]+)', text, re.IGNORECASE)
    if res_match:
        residence_sr = res_match.group(1).strip()
        if residence_sr == "Краљев":
            residence_sr = "Краљево"
    residence_en = transliterate(residence_sr)
    
    # 6. Extract married name (if female and married)
    married_name_sr = None
    if gender == "female":
        married_match = re.search(r'\b(?:удата|udata|удато|udato)\s+([\u0400-\u04FFa-zA-ZžćčšđŽĆČŠĐ]+)', text, re.IGNORECASE)
        if married_match:
            married_name_sr = married_match.group(1).strip()
        elif spouses and spouses[0]["last_name_sr"]:
            married_name_sr = spouses[0]["last_name_sr"]
            
    married_name_en = transliterate(married_name_sr)
    
    # 7. Clean up other notes
    notes = clean_mixed_chars(text)
    
    p.update({
        "first_name_sr": first_name_sr,
        "nickname_sr": nickname_sr,
        "first_name_en": first_name_en,
        "nickname_en": nickname_en,
        "gender": gender,
        "birth_year": birth_year,
        "death_year": death_year,
        "birth_date": birth_date,
        "death_date": death_date,
        "is_alive": is_alive,
        "residence_sr": residence_sr,
        "residence_en": residence_en,
        "married_name_sr": married_name_sr,
        "married_name_en": married_name_en,
        "spouses": spouses,
        "notes": notes
    })

# Run the inference for everyone
for p in people:
    calculate_gender_and_surname(p)

# Helper to trace maiden and current last names based on tree traversal
def assign_surnames(p_id, father_surname_sr, father_surname_en):
    p = next(x for x in people if x["id"] == p_id)
    
    # If the person is male, they inherit the father's surname as their own
    # If they are female, their maiden surname is the father's surname, and
    # their current surname depends on whether they are married
    if p["generation"] == 0:
        maiden_sr = "Ракићевић"
        maiden_en = "Rakićević"
        current_sr = "Ракићевић"
        current_en = "Rakićević"
    else:
        maiden_sr = father_surname_sr
        maiden_en = father_surname_en
        
        if p["gender"] == "male":
            current_sr = maiden_sr
            current_en = maiden_en
        else:
            if p["married_name_sr"]:
                current_sr = p["married_name_sr"]
                current_en = p["married_name_en"]
            else:
                current_sr = maiden_sr
                current_en = maiden_en
                
    p["maiden_name_sr"] = maiden_sr
    p["maiden_name_en"] = maiden_en
    p["current_last_name_sr"] = current_sr
    p["current_last_name_en"] = current_en
    
    # Children surnames to pass down:
    # If this person is MALE, children inherit their surname!
    # If this person is FEMALE, children inherit their HUSBAND's surname (which is their married name)!
    pass_sr = current_sr if p["gender"] == "male" else (p["married_name_sr"] or maiden_sr)
    pass_en = current_en if p["gender"] == "male" else (p["married_name_en"] or maiden_en)
    
    # Exceptions:
    # Let's see: Miladin's children:
    # Filip Andrej Lomen was from first marriage with Elena Lomen. So his maiden last name is Lomen!
    # We will override specifically when parsing children.
    
    for child_id in p["children_ids"]:
        child = next(x for x in people if x["id"] == child_id)
        
        child_pass_sr = pass_sr
        child_pass_en = pass_en
        
        # Specific override for Filip Andrej Lomen
        if child["id"] == "p56" or "Lomen" in child["raw_text"]:
            child_pass_sr = "Ломен"
            child_pass_en = "Lomen"
            
        assign_surnames(child_id, child_pass_sr, child_pass_en)

# Run surname assignment
assign_surnames("p0", "Ракићевић", "Rakićević")

# Let's format the tree recursively for the hierarchical view
def build_hierarchical_tree(p_id):
    p = next(x for x in people if x["id"] == p_id)
    
    spouses_flat = []
    for sp in p["spouses"]:
        sp_info = {
            "first_name_sr": sp["first_name_sr"],
            "last_name_sr": sp["last_name_sr"] or sp["maiden_name_sr"],
            "maiden_name_sr": sp["maiden_name_sr"],
            "first_name_en": sp["first_name_en"],
            "last_name_en": sp["last_name_en"] or sp["maiden_name_en"],
            "maiden_name_en": sp["maiden_name_en"],
            "gender": sp["gender"],
            "birth_year": sp["birth_year"],
            "death_year": sp["death_year"],
            "is_alive": sp["is_alive"],
            "origin_sr": sp["origin_sr"],
            "origin_en": sp["origin_en"],
            "marriage_year": sp["marriage_year"]
        }
        spouses_flat.append(sp_info)
        
    node = {
        "id": p["id"],
        "first_name_sr": p["first_name_sr"],
        "nickname_sr": p["nickname_sr"],
        "maiden_name_sr": p["maiden_name_sr"],
        "current_last_name_sr": p["current_last_name_sr"],
        "first_name_en": p["first_name_en"],
        "nickname_en": p["nickname_en"],
        "maiden_name_en": p["maiden_name_en"],
        "current_last_name_en": p["current_last_name_en"],
        "gender": p["gender"],
        "birth_year": p["birth_year"],
        "death_year": p["death_year"],
        "birth_date": p["birth_date"],
        "death_date": p["death_date"],
        "is_alive": p["is_alive"],
        "residence_sr": p["residence_sr"],
        "residence_en": p["residence_en"],
        "generation": p["generation"],
        "spouses": spouses_flat,
        "children": [build_hierarchical_tree(cid) for cid in p["children_ids"]]
    }
    return node

tree_root = build_hierarchical_tree("p0")

# Prepare the flat list of individuals with IDs and parent/spouse references
flat_individuals = []
for p in people:
    spouses_flat = []
    for sp in p["spouses"]:
        sp_info = {
            "first_name_sr": sp["first_name_sr"],
            "last_name_sr": sp["last_name_sr"] or sp["maiden_name_sr"],
            "maiden_name_sr": sp["maiden_name_sr"],
            "first_name_en": sp["first_name_en"],
            "last_name_en": sp["last_name_en"] or sp["maiden_name_en"],
            "maiden_name_en": sp["maiden_name_en"],
            "gender": sp["gender"],
            "birth_year": sp["birth_year"],
            "death_year": sp["death_year"],
            "is_alive": sp["is_alive"],
            "origin_sr": sp["origin_sr"],
            "origin_en": sp["origin_en"],
            "marriage_year": sp["marriage_year"]
        }
        spouses_flat.append(sp_info)
        
    flat_individuals.append({
        "id": p["id"],
        "first_name_sr": p["first_name_sr"],
        "nickname_sr": p["nickname_sr"],
        "maiden_name_sr": p["maiden_name_sr"],
        "current_last_name_sr": p["current_last_name_sr"],
        "first_name_en": p["first_name_en"],
        "nickname_en": p["nickname_en"],
        "maiden_name_en": p["maiden_name_en"],
        "current_last_name_en": p["current_last_name_en"],
        "gender": p["gender"],
        "birth_year": p["birth_year"],
        "death_year": p["death_year"],
        "birth_date": p["birth_date"],
        "death_date": p["death_date"],
        "is_alive": p["is_alive"],
        "residence_sr": p["residence_sr"],
        "residence_en": p["residence_en"],
        "generation": p["generation"],
        "parent_id": p["parent_id"],
        "children_ids": p["children_ids"],
        "spouses": spouses_flat,
        "raw_text": p["raw_text"]
    })

output_json = {
    "metadata": {
        "title_sr": "Rodoslov Milenko Rakićević",
        "title_en": "Genealogy of Milenko Rakićević",
        "date_extracted": "2026-05-24",
        "total_individuals": len(people)
    },
    "tree": tree_root,
    "individuals": flat_individuals
}

with open("rodoslov.json", "w", encoding="utf-8") as f:
    json.dump(output_json, f, ensure_ascii=False, indent=2)

print(f"Successfully processed {len(people)} people and wrote to rodoslov.json!")
