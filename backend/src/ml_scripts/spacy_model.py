# spacy_model.py
import spacy
from spacy.tokens import DocBin, Span
from spacy.training import Example
import random
from spacy.util import minibatch, compounding
import numpy as np
import shutil
import os

def train_model():
    # Load base model
    nlp = spacy.load("en_core_web_lg")

    # Add components
    if "textcat" not in nlp.pipe_names:
        textcat = nlp.add_pipe("textcat", last=True)
    else:
        textcat = nlp.get_pipe("textcat")

    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner", last=True)
    else:
        ner = nlp.get_pipe("ner")

    # Add labels
    intents = ["get_parent", "get_children", "get_sibling", "get_details", "get_dob", "count_brothers", "count_sisters", "get_bio", "get_relation", "get_group_members", "get_collaborators", "get_collaborator_role", "get_collaborator_status", "get_collaboration_info", "unknown"]
    for label in intents:
        textcat.add_label(label)
    ner.add_label("FAMILY_MEMBER")
    ner.add_label("RELATION")

    # Training samples with a focus on multi-word names and improved disambiguation
    raw_samples = [
        ("Who is the father of Rohith?", ["RELATION", "FAMILY_MEMBER"], ["father", "Rohith"], {"get_parent": 1.0}),
        ("Who is the father of John doe?", ["RELATION", "FAMILY_MEMBER"], ["father", "John doe"], {"get_parent": 1.0}),
        ("Who is the mother of Rohith?", ["RELATION", "FAMILY_MEMBER"], ["mother", "Rohith"], {"get_parent": 1.0}),
        ("Who is the mother of john doe?", ["RELATION", "FAMILY_MEMBER"], ["mother", "john doe"], {"get_parent": 1.0}),
        ("Who is the sister of Ramesh?", ["RELATION", "FAMILY_MEMBER"], ["sister", "Ramesh"], {"get_sibling": 1.0}),
        ("Who is the brother of Ramesh?", ["RELATION", "FAMILY_MEMBER"], ["brother", "Ramesh"], {"get_sibling": 1.0}),
        ("Tell me about John doe's father", ["FAMILY_MEMBER", "RELATION"], ["John doe", "father"], {"get_parent": 1.0}),
        ("John doe's son", ["FAMILY_MEMBER", "RELATION"], ["John doe", "son"], {"get_children": 1.0}),
        ("What is John doe's birthdate?", ["FAMILY_MEMBER"], ["John doe"], {"get_dob": 1.0}),
        ("How many sisters does John doe have?", ["FAMILY_MEMBER", "RELATION"], ["John doe", "sisters"], {"count_sisters": 1.0}),
        ("Tell me about the bio of Jane doe", ["FAMILY_MEMBER"], ["Jane doe"], {"get_bio": 1.0}),
        ("What is the bio of Jane doe", ["FAMILY_MEMBER"], ["Jane doe"], {"get_bio": 1.0}),
        ("Tell me about Jane doe", ["FAMILY_MEMBER"], ["Jane doe"], {"get_details": 1.0}),
        ("who is Jane doe", ["FAMILY_MEMBER"], ["Jane doe"], {"get_details": 1.0}),
        (" Jane doe's information", ["FAMILY_MEMBER"], ["Jane doe"], {"get_details": 1.0}),
        ("Who is the son of Jane doe?", ["RELATION", "FAMILY_MEMBER"], ["son", "Jane doe"], {"get_children": 1.0}),
        ("Who is the son of peter doe?", ["RELATION", "FAMILY_MEMBER"], ["son", "peter doe"], {"get_children": 1.0}),
        ("Who is the daughter of John doe?", ["RELATION", "FAMILY_MEMBER"], ["daughter", "John doe"], {"get_children": 1.0}),
        ("Who is the brother of Jane doe?", ["RELATION", "FAMILY_MEMBER"], ["brother", "Jane doe"], {"get_sibling": 1.0}),
        ("Who is the cousin of Jane doe?", ["RELATION", "FAMILY_MEMBER"], ["cousin", "Jane doe"], {"get_relation": 1.0}),
        ("Who is the son of Sundar?", ["RELATION", "FAMILY_MEMBER"], ["son", "Sundar"], {"get_children": 1.0}),
        ("Who are the children of Shankar?", ["RELATION", "FAMILY_MEMBER"], ["children", "Shankar"], {"get_children": 1.0}),
        ("Rohith's father", ["FAMILY_MEMBER", "RELATION"], ["Rohith", "father"], {"get_parent": 1.0}),
        ("Who are Rohith's children?", ["FAMILY_MEMBER", "RELATION"], ["Rohith", "children"], {"get_children": 1.0}),
        ("Who are jayamma's children?", ["FAMILY_MEMBER", "RELATION"], ["jayamma", "children"], {"get_children": 1.0}),
        ("What is Rohith's relation to John?", ["FAMILY_MEMBER", "RELATION"], ["Rohith", "John"], {"get_relation": 1.0}),
        ("Who are the members of my family group?", [], [], {"get_group_members": 1.0}),
        ("Who is Aarav's grandfather?", ["FAMILY_MEMBER", "RELATION"], ["Aarav", "grandfather"], {"get_parent": 1.0}),
        ("Does Priya have a sister?", ["FAMILY_MEMBER", "RELATION"], ["Priya", "sister"], {"get_sibling": 1.0}),
        ("Does Priya have a brother?", ["FAMILY_MEMBER", "RELATION"], ["Priya", "brother"], {"get_sibling": 1.0}),
        ("Tell me about Sneha's uncle", ["FAMILY_MEMBER", "RELATION"], ["Sneha", "uncle"], {"get_relation": 1.0}),
        ("Who is the grandmother of Kavya?", ["RELATION", "FAMILY_MEMBER"], ["grandmother", "Kavya"], {"get_parent": 1.0}),
        ("Is Ramesh related to his aunt?", ["FAMILY_MEMBER", "RELATION"], ["Ramesh", "aunt"], {"get_relation": 1.0}),
        ("Who are my collaborators?", [], [], {"get_collaborators": 1.0}),
        ("Who are the active collaborators on my map?", [], [], {"get_collaborators": 1.0}),
        ("What is Sneha's role?", ["FAMILY_MEMBER"], ["Sneha"], {"get_collaborator_role": 1.0}),
        ("What is the role of Rohith in the current sharing model?", ["FAMILY_MEMBER"], ["Rohith"], {"get_collaborator_role": 1.0}),
        ("What is Rohith's role?", ["FAMILY_MEMBER"], ["Rohith"], {"get_collaborator_role": 1.0}),
        ("Describe Arjun's role?", ["FAMILY_MEMBER"], ["Arjun"], {"get_collaborator_role": 1.0}),
        ("Describe sukesh's role?", ["FAMILY_MEMBER"], ["sukesh"], {"get_collaborator_role": 1.0}),
        ("Is Arjun still active?", ["FAMILY_MEMBER"], ["Arjun"], {"get_collaborator_status": 1.0}),
        ("Why is collaboration useful?", [], [], {"get_collaboration_info": 1.0}),
        ("I meant her role as a contributor", ["FAMILY_MEMBER"], ["Sneha"], {"get_collaborator_role": 1.0}),
        ("I meant Rohith from the project", ["FAMILY_MEMBER"], ["Rohith"], {"get_collaborator_role": 1.0}),
        ("I meant his role as a contributor", ["FAMILY_MEMBER"], ["Rohith"], {"get_collaborator_role": 1.0}),
        ("Tell me about her family connection", ["FAMILY_MEMBER"], ["Sneha"], {"get_details": 1.0}),
        ("I was asking about her status", ["FAMILY_MEMBER"], ["Sneha"], {"get_collaborator_status": 1.0}),
        ("I meant Sneha's collaborator role", ["FAMILY_MEMBER"], ["Sneha"], {"get_collaborator_role": 1.0}),
        ("Sneha the family member", ["FAMILY_MEMBER"], ["Sneha"], {"get_details": 1.0}),
        ("Her contributor role", ["FAMILY_MEMBER"], ["Sneha"], {"get_collaborator_role": 1.0}),
        ("Family side", ["FAMILY_MEMBER"], ["Sneha"], {"get_details": 1.0}),
        ("How many albums do I have?", [], [], {"unknown": 1.0}),
        ("What is the meaning of life?", [], [], {"unknown": 1.0}),
        ("What is the bio of Peter doe", ["FAMILY_MEMBER"], ["Peter doe"], {"get_bio": 1.0}),
        ("Who is the father of Peter doe?", ["RELATION", "FAMILY_MEMBER"], ["father", "Peter doe"], {"get_parent": 1.0}),
        ("What is Jane Doe's bio?", ["FAMILY_MEMBER"], ["Jane Doe"], {"get_bio": 1.0}),
        ("who is Peter doe", ["FAMILY_MEMBER"], ["Peter doe"], {"get_details": 1.0}),
        ("Tell me about Peter doe", ["FAMILY_MEMBER"], ["Peter doe"], {"get_details": 1.0}),
        ("What is the DOB of Peter Doe?", ["FAMILY_MEMBER"], ["Peter Doe"], {"get_dob": 1.0}),
        ("When was Sundar murthy born?", ["FAMILY_MEMBER"], ["Sundar murthy"], {"get_dob": 1.0}),
        ("who is John Doe", ["FAMILY_MEMBER"], ["John Doe"], {"get_details": 1.0}),
        ("Tell me about John Doe", ["FAMILY_MEMBER"], ["John Doe"], {"get_details": 1.0}),
    ]

    # Convert to DocBin
    doc_bin = DocBin()
    for text, labels, phrases, cats in raw_samples:
        doc = nlp.make_doc(text)
        spans = []
        print(f"\n📄 Text: {text}")
        for label, phrase_text in zip(labels, phrases):
            start_token_index = -1
            end_token_index = -1
            phrase_tokens = phrase_text.lower().split()

            for i in range(len(doc) - len(phrase_tokens) + 1):
                if all(doc[i+j].text.lower() == phrase_tokens[j] for j in range(len(phrase_tokens))):
                    start_token_index = i
                    end_token_index = i + len(phrase_tokens)
                    break
            
            if start_token_index != -1:
                span = doc[start_token_index:end_token_index]
                span.label_ = label
                spans.append(span)
                print(f"🔍 Entity: '{span.text}' | Label: {label} | Start: {span.start_char} | End: {span.end_char}")
            else:
                print(f"⚠️ Could not find token span for '{phrase_text}' in '{text}'")

        doc.ents = spans
        for intent in intents:
            doc.cats[intent] = cats.get(intent, 0.0)
        doc_bin.add(doc)

    BASE_DIR=os.path.dirname(os.path.abspath(__file__))
    doc_bin.to_disk(os.path.join(BASE_DIR,"training_data.spacy"))
    docs = list(doc_bin.get_docs(nlp.vocab))
    examples = [Example.from_dict(doc, {"entities": [(ent.start_char, ent.end_char, ent.label_) for ent in doc.ents], "cats": doc.cats}) for doc in docs]

    optimizer = nlp.initialize()
    n_iter = 50
    for i in range(n_iter):
        random.shuffle(examples)
        batches = minibatch(examples, size=compounding(4.0, 32.0, 1.05))
        losses = {}
        for batch in batches:
            nlp.update(batch, sgd=optimizer, losses=losses)
        print(f"Iteration {i+1} Losses: {losses}")

    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_DIR = os.path.join(BASE_DIR, "model", "family_tree_model_v3")

    os.makedirs(os.path.dirname(MODEL_DIR),exist_ok=True)

    if os.path.exists(MODEL_DIR):
        print(f"Removing old model at: {MODEL_DIR}")
        shutil.rmtree(MODEL_DIR)

    nlp.to_disk(MODEL_DIR, exclude=["parser", "tagger", "attribute_ruler", "lemmatizer", "senter"])
    print(f"Trained model saved to {MODEL_DIR}")

def load_ner_model():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_DIR = os.path.join(BASE_DIR, "model", "family_tree_model_v3")

    if not os.path.exists(MODEL_DIR):
        raise RuntimeError(f"SpaCy model not found at {MODEL_DIR}")

    return spacy.load(
        MODEL_DIR,
        exclude=["parser", "tagger", "attribute_ruler", "lemmatizer", "senter"]
    )


if __name__ == "__main__":
    train_model()