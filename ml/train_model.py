"""
Train a multi-label Random Forest that predicts which of the 5 schemes a user
is eligible for, from: age, income, occupation, gender.

NOTE: There is no real-world labelled dataset for this task, so training data
is SYNTHETIC. Profiles are generated randomly and labelled using the scheme
eligibility rules in schemes.json. The model therefore learns to approximate
those rules. This must be stated clearly in the report/presentation.
"""
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

rng = np.random.default_rng(42)

SCHEMES = [
    # id, occupations, gender, min_income, max_income  (same as schemes.json)
    ("pm-kisan", ["farmer"], None, 0, 200000),
    ("ayushman-bharat", ["any"], None, 0, 250000),
    ("pmay", ["any"], None, 0, 300000),
    ("sukanya-samriddhi", ["any"], ["female"], 0, 1000000),
    ("national-scholarship", ["student"], None, 0, 250000),
]
OCCUPATIONS = ["farmer", "student", "labourer", "self-employed", "salaried", "unemployed", "other"]
GENDERS = ["male", "female", "other"]
THRESHOLDS = [200000, 250000, 300000, 1000000]


def label(age, income, occ, gender):
    out = []
    for _id, occs, genders, lo, hi in SCHEMES:
        occ_ok = "any" in occs or occ in occs
        inc_ok = lo <= income <= hi
        gen_ok = True if genders is None else gender in genders
        out.append(int(occ_ok and inc_ok and gen_ok))
    return out


def make_dataset(n=24000):
    rows = []
    for i in range(n):
        age = int(rng.integers(5, 80))
        # 70% uniform income, 30% close to a rule threshold so the boundaries are learned well
        if rng.random() < 0.7:
            income = int(rng.integers(0, 1_500_000))
        else:
            t = THRESHOLDS[int(rng.integers(0, len(THRESHOLDS)))]
            income = max(0, int(t + rng.integers(-40000, 40000)))
        occ = OCCUPATIONS[int(rng.integers(0, len(OCCUPATIONS)))]
        gender = GENDERS[int(rng.integers(0, len(GENDERS)))]
        rows.append([age, income, occ, gender] + label(age, income, occ, gender))
    cols = ["age", "income", "occupation", "gender"] + [s[0] for s in SCHEMES]
    return pd.DataFrame(rows, columns=cols)


def encode(df):
    X = pd.DataFrame({"age": df["age"], "income": df["income"]})
    for o in OCCUPATIONS:
        X["occ_" + o] = (df["occupation"] == o).astype(int)
    for g in GENDERS:
        X["gen_" + g] = (df["gender"] == g).astype(int)
    return X


if __name__ == "__main__":
    df = make_dataset()
    df.to_csv("synthetic_training_data.csv", index=False)
    X = encode(df)
    y = df[[s[0] for s in SCHEMES]]

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=30, max_depth=9, random_state=42, n_jobs=-1)
    clf.fit(X_tr, y_tr)

    pred = clf.predict(X_te)
    print("Samples: train=%d test=%d" % (len(X_tr), len(X_te)))
    print("Exact-match accuracy (all 5 labels right): %.4f" % accuracy_score(y_te, pred))
    print("Micro F1: %.4f   Macro F1: %.4f" % (f1_score(y_te, pred, average="micro"), f1_score(y_te, pred, average="macro")))
    print(classification_report(y_te, pred, target_names=[s[0] for s in SCHEMES], digits=4))

    imp = sorted(zip(X.columns, clf.feature_importances_), key=lambda t: -t[1])
    print("Feature importance:")
    for n, v in imp:
        print("  %-18s %.3f" % (n, v))

    # ---- export forest to JSON so the Node backend can run it (no Python server needed) ----
    trees = []
    for est in clf.estimators_:
        t = est.tree_
        # value: [nodes, outputs, classes] -> P(eligible) per output
        val = t.value
        p1 = []
        for node in range(t.node_count):
            probs = []
            for o in range(val.shape[1]):
                tot = val[node, o].sum()
                cls = est.classes_[o]
                idx1 = list(cls).index(1) if 1 in cls else None
                probs.append(round(float(val[node, o][idx1] / tot), 4) if idx1 is not None else 0.0)
            p1.append(probs)
        trees.append({
            "left": t.children_left.tolist(),
            "right": t.children_right.tolist(),
            "feature": t.feature.tolist(),
            "threshold": [round(float(x), 4) for x in t.threshold],
            "prob": p1,
        })
    model = {
        "features": list(X.columns),
        "schemes": [s[0] for s in SCHEMES],
        "occupations": OCCUPATIONS,
        "genders": GENDERS,
        "trees": trees,
    }
    with open("model.json", "w") as f:
        json.dump(model, f, separators=(",", ":"))
    print("model.json written")

    # reference predictions for testing the Node port
    ref = X_te.head(200)
    probs = np.mean([[e.predict_proba(ref)[o][:, list(e.classes_[o]).index(1)] if 1 in e.classes_[o] else np.zeros(len(ref))
                      for o in range(5)] for e in clf.estimators_], axis=0)
    ref_out = {"X": ref.values.tolist(), "probs": np.round(probs.T, 4).tolist()}
    json.dump(ref_out, open("reference.json", "w"))
