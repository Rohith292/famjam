
import spacy
import traceback
import json
import sys
import os
import datetime

try:
    print("Script started", file=sys.stderr)

    model_path = "D:/family-map/backend/src/ml_scripts/model/family_tree_model_v3"
    
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}. Please run spacy_model.py first.", file=sys.stderr)
        sys.exit(1)
    
    mod_time = os.path.getmtime(model_path)
    mod_datetime = datetime.datetime.fromtimestamp(mod_time)
    print(f"Loading model from: {model_path}", file=sys.stderr)
    print(f"Model last modified: {mod_datetime}", file=sys.stderr)

    nlp = spacy.load(model_path, exclude=["tagger", "parser", "attribute_ruler", "lemmatizer", "senter"])


    def process_query(query, context=None):
        doc = nlp(query)

        print(f"doc.cats: {doc.cats}", file=sys.stderr)
        print(f"doc.ents: {[ (ent.text, ent.label_) for ent in doc.ents ]}", file=sys.stderr)

        # Intent detection
        intent_scores = doc.cats
        top_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)

        intent = top_intents[0][0] if top_intents else "unknown"
        confidence = top_intents[0][1] if top_intents else 0.0
        second_confidence = top_intents[1][1] if len(top_intents) > 1 else 0.0
        ambiguous = abs(confidence - second_confidence) < 0.3 and intent != "unknown"

        # Post-processing to merge broken entities
        temp_entities = []
        i = 0
        while i < len(doc.ents):
            current_ent = doc.ents[i]
            
            # Fix multi-word names like "John doe"
            if current_ent.label_ == "RELATION" and i + 1 < len(doc.ents) and doc.ents[i+1].text.lower() == 'doe':
                combined_name = f"{current_ent.text} {doc.ents[i+1].text}"
                temp_entities.append(spacy.tokens.Span(doc, current_ent.start, doc.ents[i+1].end, label="FAMILY_MEMBER"))
                i += 2
            else:
                temp_entities.append(current_ent)
                i += 1
        
        family_member_names = []
        relation_name = None
        for ent in temp_entities:
            if ent.label_ == "FAMILY_MEMBER":
                family_member_names.append(ent.text)
            elif ent.label_ == "RELATION":
                relation_name = ent.text

        entity_name = " ".join(family_member_names) if family_member_names else None

        result = {
            "intent": intent,
            "entity": entity_name,
            "relation": relation_name,
            "ambiguous": ambiguous
        }

        return json.dumps(result)

    if __name__ == "__main__":
        if len(sys.argv) < 2:
            print("Usage: python predict.py \"<your query>\"", file=sys.stderr)
            sys.exit(1)
        
        user_query = sys.argv[1]
        response = process_query(user_query)
        print(response)

except Exception as e:
    print(f"An error occurred: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)