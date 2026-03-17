import json
from pathlib import Path

import pytest

pytest.importorskip("bitcointx")
pytest.importorskip("secp256k1")
pytest.importorskip("ecdsa")

from backend.calc_functions import calc_func as calc


VECTORS_DIR = Path(__file__).resolve().parent / "vectors" / "bip327"


def _load_vectors(filename: str) -> dict:
    path = VECTORS_DIR / filename
    if not path.exists():
        pytest.fail(f"Missing BIP327 vector file: {path}")
    return json.loads(path.read_text())


KEY_AGG_VECTORS = _load_vectors("key_agg_vectors.json")
NONCE_GEN_VECTORS = _load_vectors("nonce_gen_vectors.json")
NONCE_AGG_VECTORS = _load_vectors("nonce_agg_vectors.json")
SIGN_VERIFY_VECTORS = _load_vectors("sign_verify_vectors.json")
SIG_AGG_VECTORS = _load_vectors("sig_agg_vectors.json")


def _pick(items: list[str], indices: list[int]) -> list[str]:
    return [items[i] for i in indices]


def _apply_tweak_sequence(
    pubkeys: list[str],
    tweaks: list[str],
    tweak_indices: list[int],
    is_xonly: list[bool],
) -> dict:
    if len(tweak_indices) != len(is_xonly):
        raise ValueError("tweak_indices and is_xonly length mismatch")

    ctx = json.loads(calc.musig2_aggregate_pubkeys(pubkeys))
    for t_idx, xonly_mode in zip(tweak_indices, is_xonly):
        tweak = tweaks[t_idx]
        ctx = json.loads(
            calc.musig2_apply_tweak(
                [json.dumps(ctx), tweak, "true" if xonly_mode else "false"]
            )
        )
    return ctx


def _recover_q_and_accumulators(ctx: dict) -> tuple[object, int, int]:
    q_xonly = bytes.fromhex(ctx["aggregated_pubkey"])
    Q = calc._lift_x_from_bytes(q_xonly)
    if int(ctx["parity"]) == 1:
        Q = calc._negate_point(Q)

    gacc_raw = str(ctx["gacc"])
    if len(gacc_raw) <= 2:
        gacc = int(gacc_raw, 16)
    else:
        gacc = int.from_bytes(bytes.fromhex(gacc_raw), "big")
    gacc %= calc._CURVE_ORDER

    tacc = int.from_bytes(bytes.fromhex(ctx["tacc"]), "big") % calc._CURVE_ORDER
    return Q, gacc, tacc


def _partial_sig_verify_case(sig_hex: str, case: dict) -> str:
    pubkeys = _pick(SIGN_VERIFY_VECTORS["pubkeys"], case["key_indices"])
    pnonces = _pick(SIGN_VERIFY_VECTORS["pnonces"], case["nonce_indices"])
    signer_index = case["signer_index"]
    msg = SIGN_VERIFY_VECTORS["msgs"][case["msg_index"]]
    aggnonce = calc.musig2_nonce_agg(pnonces)
    signer_pubnonce = pnonces[signer_index]
    signer_pk = pubkeys[signer_index]
    return calc.musig2_partial_sig_verify(
        [sig_hex, signer_pubnonce, signer_pk, aggnonce, msg, "", *pubkeys]
    )


def _sig_agg_with_tweak_sequence(case: dict) -> str:
    pubkeys = _pick(SIG_AGG_VECTORS["pubkeys"], case["key_indices"])
    ctx = _apply_tweak_sequence(
        pubkeys,
        SIG_AGG_VECTORS["tweaks"],
        case.get("tweak_indices", []),
        case.get("is_xonly", []),
    )
    Q, _gacc, tacc = _recover_q_and_accumulators(ctx)

    aggnonce = bytes.fromhex(case["aggnonce"])
    msg = bytes.fromhex(SIG_AGG_VECTORS["msg"])

    b = calc._musig2_nonce_coeff(aggnonce, calc._int_to_32(Q.x()), msg)
    R1 = calc._point_from_compressed_ext(aggnonce[:33], name="aggnonce R1")
    R2 = calc._point_from_compressed_ext(aggnonce[33:], name="aggnonce R2")
    R_prime = R1 + (R2 * b)
    R = calc._CURVE_GEN if calc._musig2_is_infinite(R_prime) else R_prime
    e = calc._bip340_challenge(calc._int_to_32(R.x()), calc._int_to_32(Q.x()), msg)

    s = 0
    for signer_index, psig_index in enumerate(case["psig_indices"]):
        s_i = int(SIG_AGG_VECTORS["psigs"][psig_index], 16)
        if s_i >= calc._CURVE_ORDER:
            raise ValueError(f"partial_sig[{signer_index}] must be less than curve order")
        s = (s + s_i) % calc._CURVE_ORDER

    g = 1 if (Q.y() & 1) == 0 else (calc._CURVE_ORDER - 1)
    s = (s + (e * g * tacc)) % calc._CURVE_ORDER
    return (calc._int_to_32(R.x()) + calc._int_to_32(s)).hex().upper()


def test_bip327_key_agg_vectors():
    for i, case in enumerate(KEY_AGG_VECTORS["valid_test_cases"]):
        pubkeys = _pick(KEY_AGG_VECTORS["pubkeys"], case["key_indices"])
        agg = json.loads(calc.musig2_aggregate_pubkeys(pubkeys))
        assert agg["aggregated_pubkey"].upper() == case["expected"], f"valid key agg case {i}"

    for i, case in enumerate(KEY_AGG_VECTORS["error_test_cases"]):
        pubkeys = _pick(KEY_AGG_VECTORS["pubkeys"], case["key_indices"])
        with pytest.raises(ValueError):
            if case.get("tweak_indices"):
                _apply_tweak_sequence(
                    pubkeys,
                    KEY_AGG_VECTORS["tweaks"],
                    case["tweak_indices"],
                    case["is_xonly"],
                )
            else:
                calc.musig2_aggregate_pubkeys(pubkeys)


def test_bip327_nonce_gen_vectors():
    for i, case in enumerate(NONCE_GEN_VECTORS["test_cases"]):
        out = json.loads(
            calc.musig2_nonce_gen(
                [
                    case.get("sk"),
                    case.get("pk"),
                    case.get("aggpk"),
                    case.get("msg"),
                    case["rand_"],
                    case.get("extra_in"),
                ]
            )
        )
        assert out["secnonce"].upper() == case["expected_secnonce"], f"secnonce case {i}"
        assert out["pubnonce"].upper() == case["expected_pubnonce"], f"pubnonce case {i}"


def test_bip327_nonce_agg_vectors():
    for i, case in enumerate(NONCE_AGG_VECTORS["valid_test_cases"]):
        pnonces = _pick(NONCE_AGG_VECTORS["pnonces"], case["pnonce_indices"])
        got = calc.musig2_nonce_agg(pnonces)
        assert got.upper() == case["expected"], f"valid nonce agg case {i}"

    for i, case in enumerate(NONCE_AGG_VECTORS["error_test_cases"]):
        pnonces = _pick(NONCE_AGG_VECTORS["pnonces"], case["pnonce_indices"])
        with pytest.raises(ValueError):
            calc.musig2_nonce_agg(pnonces)


def test_bip327_sign_vectors():
    sk = SIGN_VERIFY_VECTORS["sk"]
    secnonce = SIGN_VERIFY_VECTORS["secnonces"][0]

    for i, case in enumerate(SIGN_VERIFY_VECTORS["valid_test_cases"]):
        pubkeys = _pick(SIGN_VERIFY_VECTORS["pubkeys"], case["key_indices"])
        msg = SIGN_VERIFY_VECTORS["msgs"][case["msg_index"]]
        aggnonce = SIGN_VERIFY_VECTORS["aggnonces"][case["aggnonce_index"]]

        sig = calc.musig2_partial_sign([sk, secnonce, aggnonce, msg, "", *pubkeys])
        assert sig.upper() == case["expected"], f"valid sign case {i}"

    for i, case in enumerate(SIGN_VERIFY_VECTORS["sign_error_test_cases"]):
        pubkeys = _pick(SIGN_VERIFY_VECTORS["pubkeys"], case["key_indices"])
        msg = SIGN_VERIFY_VECTORS["msgs"][case["msg_index"]]
        aggnonce = SIGN_VERIFY_VECTORS["aggnonces"][case["aggnonce_index"]]
        bad_secnonce = SIGN_VERIFY_VECTORS["secnonces"][case["secnonce_index"]]

        with pytest.raises(ValueError):
            calc.musig2_partial_sign([sk, bad_secnonce, aggnonce, msg, "", *pubkeys])


def test_bip327_partial_sig_verify_vectors():
    for i, case in enumerate(SIGN_VERIFY_VECTORS["valid_test_cases"]):
        assert _partial_sig_verify_case(case["expected"], case) == "true", f"verify valid case {i}"

    for i, case in enumerate(SIGN_VERIFY_VECTORS["verify_fail_test_cases"]):
        assert _partial_sig_verify_case(case["sig"], case) == "false", f"verify fail case {i}"

    for i, case in enumerate(SIGN_VERIFY_VECTORS["verify_error_test_cases"]):
        with pytest.raises(ValueError):
            _partial_sig_verify_case(case["sig"], case)


def test_bip327_sig_agg_public_api_subset_vectors():
    no_tweak_cases = [
        c for c in SIG_AGG_VECTORS["valid_test_cases"] if not c.get("tweak_indices")
    ]
    assert no_tweak_cases, "expected at least one no-tweak sig_agg vector"

    for i, case in enumerate(no_tweak_cases):
        pubkeys = _pick(SIG_AGG_VECTORS["pubkeys"], case["key_indices"])
        psigs = _pick(SIG_AGG_VECTORS["psigs"], case["psig_indices"])
        got = calc.musig2_partial_sig_agg(
            [case["aggnonce"], SIG_AGG_VECTORS["msg"], "", *pubkeys, *psigs]
        )
        assert got.upper() == case["expected"], f"public sig_agg no-tweak case {i}"

    err_case = SIG_AGG_VECTORS["error_test_cases"][0]
    err_pubkeys = _pick(SIG_AGG_VECTORS["pubkeys"], err_case["key_indices"])
    err_psigs = _pick(SIG_AGG_VECTORS["psigs"], err_case["psig_indices"])
    with pytest.raises(ValueError, match="partial_sig\\[1\\] must be less than curve order"):
        calc.musig2_partial_sig_agg(
            [err_case["aggnonce"], SIG_AGG_VECTORS["msg"], "", *err_pubkeys, *err_psigs]
        )


def test_bip327_sig_agg_vectors_with_tweak_sequences():
    for i, case in enumerate(SIG_AGG_VECTORS["valid_test_cases"]):
        got = _sig_agg_with_tweak_sequence(case)
        assert got == case["expected"], f"sig_agg sequence case {i}"

    for i, case in enumerate(SIG_AGG_VECTORS["error_test_cases"]):
        with pytest.raises(ValueError, match="partial_sig\\[1\\] must be less than curve order"):
            _sig_agg_with_tweak_sequence(case)
