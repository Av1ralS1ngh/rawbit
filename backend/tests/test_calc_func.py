import binascii
import concurrent.futures
import hashlib
import json
from decimal import Decimal

import pytest

pytest.importorskip("hypothesis")
from hypothesis import given, strategies as st

pytest.importorskip("bitcointx")
pytest.importorskip("secp256k1")
pytest.importorskip("ecdsa")

from backend.calc_functions import calc_func as calc
from bitcointx.core import (
    CMutableTransaction,
    CMutableTxIn,
    CMutableTxOut,
    COutPoint,
    CTxInWitness,
    b2x,
)
from bitcointx.core.script import CScript, CScriptWitness
import secp256k1

SAMPLE_PRIV_KEY = "01".rjust(64, "0")
SAMPLE_MSG_HASH = "0f" * 32
SAMPLE_SIGNATURE = (
    "304402203b553accbd4b08f905b299be1ca40ea106148218d3a52f0972908276697248ce"
    "02207254bbdbbe0717a1c52882066b4c0080322a1e12ff7adaa872fba02659ea6c91"
)
SAMPLE_TX_HEX = (
    "02000000010000000000000000000000000000000000000000000000000000000000000000000000000151"
    "ffffffff01e803000000000000015100000000"
)
GENESIS_HASH160 = "62e907b15cbf27d5425399ebf6f0fb50ebb88f18"


def build_sample_tx_hex() -> str:
    prev_txid = bytes.fromhex("00" * 32)
    outpoint = COutPoint(prev_txid, 0)
    tx_in = CMutableTxIn(outpoint, CScript([1]), 0xFFFFFFFF)
    tx_out = CMutableTxOut(1000, CScript([1]))
    tx = CMutableTransaction(vin=[tx_in], vout=[tx_out])
    return b2x(tx.serialize())


def build_p2wsh_op_true_tx():
    witness_script = CScript([1])
    wsh = hashlib.sha256(bytes(witness_script)).hexdigest()
    script_pubkey_hex = "0020" + wsh

    txin = CMutableTxIn(COutPoint(b"\x00" * 32, 0))
    txout = CMutableTxOut(0, CScript([0]))
    tx = CMutableTransaction(vin=[txin], vout=[txout])

    witness = CTxInWitness(scriptWitness=CScriptWitness([bytes(witness_script)]))
    tx.wit.vtxinwit = (witness,)

    return tx, script_pubkey_hex, witness_script


@pytest.mark.parametrize(
    "payload, expected",
    [
        (b"\x00", "1"),
        (bytes.fromhex("0062e907b15cbf27d5425399ebf6f0fb50ebb88f18"), None),
    ],
)
def test_b58_roundtrip(payload, expected):
    encoded = calc._b58encode(payload)
    assert calc._b58decode(encoded) == payload
    if expected is not None:
        assert encoded == expected


def test_b58check_roundtrip_known_value():
    payload = bytes.fromhex("0062e907b15cbf27d5425399ebf6f0fb50ebb88f18")
    encoded = calc._b58check_encode(payload)
    assert encoded == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    assert calc._b58check_decode(encoded) == payload


def test_b58decode_rejects_invalid_characters():
    with pytest.raises(ValueError, match="Invalid Base58 character: '0'"):
        calc._b58decode("10")


def test_bech32_helpers():
    assert calc._bech32_hrp_expand("bc") == [3, 3, 0, 2, 3]
    assert calc._bech32_polymod([0, 1, 2, 3, 4]) == 33589348
    checksum = calc._bech32_create_checksum("bc", [0, 14, 20], 1)
    assert checksum == [26, 22, 26, 8, 30, 22]
    assert calc._convertbits(b"\xff", 8, 5, True) == [31, 28]


def test_bech32_convertbits_invalid_padding():
    with pytest.raises(ValueError, match="invalid padding"):
        calc._convertbits([31], 5, 8, pad=False)


def test_bech32_encode_decode_roundtrip():
    program = bytes.fromhex("751e76e8199196d454941c45d1b3a323f1433bd6")
    addr = calc._bech32_encode("bc", 0, program)
    assert addr == "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    hrp, ver, decoded = calc._bech32_decode(addr)
    assert hrp == "bc"
    assert ver == 0
    assert decoded == program


def test_hrp_for_network_variants():
    assert calc._hrp_for_network("mainnet") == "bc"
    assert calc._hrp_for_network("testnet") == "tb"
    assert calc._hrp_for_network("unknown") == "bcrt"


def test_secp_context_lifecycle():
    sign_ctx_first = calc._get_sign_ctx()
    sign_ctx_second = calc._get_sign_ctx()
    verify_ctx_first = calc._get_verify_ctx()
    verify_ctx_second = calc._get_verify_ctx()
    assert sign_ctx_first == sign_ctx_second
    assert verify_ctx_first == verify_ctx_second

    calc._destroy_ctxs()
    assert calc._SECP256K1_SIGN is None
    assert calc._SECP256K1_VERIFY is None
    # ensure contexts can be recreated after destruction
    assert calc._get_sign_ctx() is not None
    assert calc._get_verify_ctx() is not None


def test_deserialize_tx_cached_reuses_instance():
    tx_hex = build_sample_tx_hex()
    first = calc._deserialize_tx_cached(tx_hex)
    second = calc._deserialize_tx_cached(tx_hex)
    assert first is second


def test_bytes_from_even_hex_valid_and_invalid():
    assert calc._bytes_from_even_hex("0x00ff", name="data") == b"\x00\xff"
    with pytest.raises(ValueError):
        calc._bytes_from_even_hex("abc", name="data")


def test_identity_and_concat_all():
    assert calc.identity("hello") == "hello"
    assert calc.concat_all(["a", 1, "b"]) == "a1b"


def test_random_256_properties():
    priv = calc.random_256()
    assert len(priv) == 64
    value = int(priv, 16)
    assert 1 <= value < 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def test_public_key_from_private_key_known_vector():
    assert calc.public_key_from_private_key(SAMPLE_PRIV_KEY) == (
        "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
    )


def test_uint32_to_little_endian():
    assert calc.uint32_to_little_endian_4_bytes(1) == "01000000"
    with pytest.raises(ValueError):
        calc.uint32_to_little_endian_4_bytes(0x1_0000_0000)
    with pytest.raises(ValueError):
        calc.uint32_to_little_endian_4_bytes(-1)


def test_encode_varint_boundaries():
    assert calc.encode_varint(0) == "00"
    assert calc.encode_varint(0xfc) == "fc"
    assert calc.encode_varint(0xfd) == "fdfd00"
    assert calc.encode_varint(0x1_0000) == "fe00000100"
    assert calc.encode_varint(0x1_0000_0000) == "ff0000000001000000"
    with pytest.raises(ValueError):
        calc.encode_varint(-1)


def test_reverse_txid_bytes_and_satoshi_to_le():
    txid = "00" * 31 + "11"
    expected = bytes.fromhex(txid)[::-1].hex()
    assert calc.reverse_txid_bytes(txid) == expected
    with pytest.raises(ValueError):
        calc.reverse_txid_bytes("aa")
    assert calc.satoshi_to_8_le(5000) == "8813000000000000"


def test_double_and_single_sha256():
    assert calc.double_sha256_hex("") == (
        "5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456"
    )
    assert calc.sha256_hex("ff") == (
        "a8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89"
    )


def test_sign_and_verify_low_r_signature():
    signature = calc.sign_as_bitcoin_core_low_r([SAMPLE_PRIV_KEY, SAMPLE_MSG_HASH])
    assert signature == SAMPLE_SIGNATURE
    result = calc.verify_signature([
        calc.public_key_from_private_key(SAMPLE_PRIV_KEY),
        SAMPLE_MSG_HASH,
        signature,
    ])
    assert result == "true"


def test_write_low_r_and_serialize_helpers():
    ctx = calc._get_sign_ctx()
    sig_ptr = secp256k1.ffi.new("secp256k1_ecdsa_signature *")
    der = bytes.fromhex(SAMPLE_SIGNATURE)
    res = secp256k1.lib.secp256k1_ecdsa_signature_parse_der(ctx, sig_ptr, der, len(der))
    assert res == 1

    assert calc._is_low_r(ctx, sig_ptr) is True
    assert calc._serialize_der(ctx, sig_ptr) == SAMPLE_SIGNATURE

    buf = secp256k1.ffi.new("unsigned char[32]")
    calc._write_le32(buf, 0xDEADBEEF)
    assert bytes(secp256k1.ffi.buffer(buf, 4)) == b"\xef\xbe\xad\xde"


def test_hash160_and_varint_length():
    assert calc.hash160_hex("00") == "9f7fd096d37ed2c0e3f7f0cfc924beef4ffceb68"
    assert calc.varint_encoded_byte_length("aa") == "01"
    assert calc.varint_encoded_byte_length("aa" * 300) == "fd2c01"


def test_script_verification_simple_true():
    tx_hex = build_sample_tx_hex()
    result_json = calc.script_verification(["", "51", tx_hex, 0, "", ""])
    result = json.loads(result_json)
    assert result["isValid"] is True
    assert result["scriptPubKey"] == "51"


def test_encode_script_push_data_cases():
    assert calc.encode_script_push_data("") == "00"
    assert calc.encode_script_push_data("ff") == "01"
    assert calc.encode_script_push_data("00" * 76) == "4c4c"
    assert calc.encode_script_push_data("00" * 300) == "4d2c01"


def test_opcode_select_and_int_to_script_bytes():
    assert calc.op_code_select("76a914") == "76a914"
    assert calc.int_to_script_bytes(0) == ""
    assert calc.int_to_script_bytes(4404774) == "263643"
    with pytest.raises(ValueError):
        calc.int_to_script_bytes("abc")


def test_text_to_hex_and_block_sequence():
    assert calc.text_to_hex("satoshi") == "7361746f736869"
    assert calc.blocks_to_sequence_number(144) == 144
    with pytest.raises(ValueError):
        calc.blocks_to_sequence_number(-1)


def test_hash160_addresses_conversions():
    assert calc.hash160_to_p2sh_address("f" * 40, "mainnet") == "3R2cuenjG5nFubqX9Wzuukdin2YfBbQ6Kw"
    assert calc.hash160_to_p2pkh_address(GENESIS_HASH160, "mainnet") == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    assert calc.hash160_to_p2wpkh_address(GENESIS_HASH160, "mainnet") == "bc1qvt5s0v2uhuna2sjnn84ldu8m2r4m3rcc4048ry"
    assert calc.sha256_to_p2wsh_address("0" * 64, "mainnet") == "bc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthqst8"


def test_date_to_unix_timestamp_parsing():
    assert calc.date_to_unix_timestamp("2025-01-01") == "1735689600"
    with pytest.raises(ValueError):
        calc.date_to_unix_timestamp("2024/01/01")


def test_date_to_unix_timestamp_bounds():
    with pytest.raises(ValueError, match="too early"):
        calc.date_to_unix_timestamp("1985-10-26")
    with pytest.raises(ValueError, match="too far in the future"):
        calc.date_to_unix_timestamp("2150-01-01T00:00:00+00:00")


def test_reverse_bytes_and_hours_to_sequence():
    assert calc.reverse_bytes_4("01000000") == "00000001"
    with pytest.raises(ValueError):
        calc.reverse_bytes_4("ff")
    assert calc.hours_to_sequence_number(1.5) == 11
    assert calc.hours_to_sequence_number("1.0") == 7
    with pytest.raises(ValueError):
        calc.hours_to_sequence_number("not-a-number")


def test_hours_to_sequence_number_upper_bound_hours():
    with pytest.raises(ValueError, match="Time delay must be <="):
        calc.hours_to_sequence_number(9340)


def test_encode_sequence_flags():
    assert calc.encode_sequence_block_flag("144") == 144
    assert calc.encode_sequence_time_flag("7") == (7 | (1 << 22))
    with pytest.raises(ValueError):
        calc.encode_sequence_block_flag(-1)
    with pytest.raises(ValueError):
        calc.encode_sequence_time_flag(0x1_0000)


def test_opcode_to_value_and_errors():
    assert calc.opcode_to_value("51") == 1
    assert calc.opcode_to_value("4f") == -1
    assert calc.opcode_to_value("00") == 0
    with pytest.raises(ValueError):
        calc.opcode_to_value("ff")


def test_opcode_to_value_rejects_bad_format():
    with pytest.raises(ValueError, match="exactly 2 hex"):
        calc.opcode_to_value("000")
    with pytest.raises(ValueError, match="Invalid hex"):
        calc.opcode_to_value("zz")


def test_extract_tx_field_reads_components():
    values = {
        "version": "2",
        "locktime": "0",
        "input_count": "1",
        "output_count": "1",
        "txid": calc.extract_tx_field([SAMPLE_TX_HEX, "txid"]),
        "vin.txid": calc.extract_tx_field([SAMPLE_TX_HEX, "vin.txid", "0"]),
        "vin.vout": "0",
        "vin.scriptSig": "51",
        "vin.sequence": "4294967295",
        "vout.value": "1000",
        "vout.scriptPubKey": "51",
    }

    assert calc.extract_tx_field([SAMPLE_TX_HEX, "version"]) == values["version"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "locktime"]) == values["locktime"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "input_count"]) == values["input_count"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "output_count"]) == values["output_count"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vin.txid", "0"]) == values["vin.txid"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vin.vout", "0"]) == values["vin.vout"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vin.scriptSig", "0"]) == values["vin.scriptSig"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vin.sequence", "0"]) == values["vin.sequence"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vout.value", "0"]) == values["vout.value"]
    assert calc.extract_tx_field([SAMPLE_TX_HEX, "vout.scriptPubKey", "0"]) == values["vout.scriptPubKey"]


def test_compare_equal_and_numeric_parsers():
    assert calc.compare_equal(["a", "a", "a"]) == "true"
    assert calc.compare_equal(["a", "b"]) == "false"
    with pytest.raises(ValueError):
        calc.compare_equal(["only-one"])

    assert calc._parse_numeric_exact("0x10") == 16
    assert calc._parse_numeric_exact("10") == 10
    assert calc._parse_numeric_exact("1.5") == Decimal("1.5")
    with pytest.raises(ValueError):
        calc._parse_numeric_exact("")

    a, b = calc._coerce_for_op(1, Decimal("2.5"))
    assert isinstance(a, Decimal) and isinstance(b, Decimal)
    assert calc._num_to_str(Decimal("1.500")) == "1.5"
    assert calc._num_to_str(Decimal("2.0")) == "2"


def test_compare_numbers_and_math_operations():
    assert calc.compare_numbers(["10", "<", "20"]) == "true"
    assert calc.compare_numbers(["10", ">", "20"]) == "false"
    with pytest.raises(ValueError):
        calc.compare_numbers(["10", "!=", "20"])

    assert calc.math_operation(["10", "+", "5"]) == "15"
    assert calc.math_operation(["10", "-", "5"]) == "5"
    assert calc.math_operation(["10", "*", "5"]) == "50"
    assert calc.math_operation(["3", "/", "2"]) == "1.5"
    with pytest.raises(ValueError):
        calc.math_operation(["1", "/", "0"])


def test_hash160_and_sha256_address_helpers():
    p2pkh = calc.hash160_to_p2pkh_address(GENESIS_HASH160)
    assert calc.address_to_scriptpubkey(p2pkh) == "76a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888ac"

    p2wpkh = calc.hash160_to_p2wpkh_address(GENESIS_HASH160)
    assert calc.address_to_scriptpubkey(p2wpkh) == "001462e907b15cbf27d5425399ebf6f0fb50ebb88f18"


def test_address_to_scriptpubkey_rejects_garbage():
    with pytest.raises(ValueError, match="Unrecognized address format"):
        calc.address_to_scriptpubkey("not-an-address")


def test_hex_byte_length():
    assert calc.hex_byte_length("00ff") == 2
    assert calc.hex_byte_length("") == 0


def test_bip67_sort_pubkeys_and_check_result():
    keys = [
        "02" + "bb" * 32,
        "02" + "aa" * 32,
        "03" + "cc" * 32,
    ]
    assert calc.bip67_sort_pubkeys(keys) == "2,1,3"
    assert calc.bip67_sort_pubkeys([]) == ""

    assert calc.check_result(["true", "TRUE", ""]) == "true"
    assert calc.check_result(["false", "true"]) == "false"


def test_bip67_sort_pubkeys_rejects_invalid_inputs():
    uncompressed = "04" + "11" * 64 + "01"
    with pytest.raises(ValueError, match="33-byte compressed"):
        calc.bip67_sort_pubkeys([uncompressed])

    bad_prefix = "04" + "11" * 32
    with pytest.raises(ValueError, match="02 or 03"):
        calc.bip67_sort_pubkeys([bad_prefix])


def test_address_to_scriptpubkey_rejects_unknown_hrp():
    unknown_hrp_addr = calc._bech32_encode("zz", 0, bytes.fromhex(GENESIS_HASH160))
    with pytest.raises(ValueError, match="Unsupported HRP 'zz'"):
        calc.address_to_scriptpubkey(unknown_hrp_addr)


def test_address_to_scriptpubkey_rejects_unknown_base58_version():
    payload = bytes([0x10]) + bytes(20)
    exotic_addr = calc._b58check_encode(payload)
    with pytest.raises(ValueError, match="Unknown Base58 version byte: 0x10"):
        calc.address_to_scriptpubkey(exotic_addr)


def test_taproot_roundtrip_to_scriptpubkey():
    xonly = "11" * 32
    addr = calc._bech32_encode("bc", 1, bytes.fromhex(xonly))
    assert calc.address_to_scriptpubkey(addr) == "5120" + xonly


def test_future_witness_v2_builds_right_script():
    prog = "aabb"
    addr = calc._bech32_encode("tb", 2, bytes.fromhex(prog))
    assert calc.address_to_scriptpubkey(addr) == "5202" + prog


def test_bech32_mixed_case_rejected():
    mixed = "bc1Qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    with pytest.raises(ValueError):
        calc.address_to_scriptpubkey(mixed)


def test_bech32_v1_wrong_length_rejected():
    prog = "11" * 31
    addr = calc._bech32_encode("bc", 1, bytes.fromhex(prog))
    with pytest.raises(ValueError, match="Taproot"):
        calc.address_to_scriptpubkey(addr)

def test_bech32_v0_wrong_length_rejected(monkeypatch):
    def fake_decode(_addr):
        return "bc", 0, b"\x00" * 21

    monkeypatch.setattr(calc, "_bech32_decode", fake_decode)

    with pytest.raises(ValueError, match="v0 witness program must be 20 or 32 bytes"):
        calc.address_to_scriptpubkey("bc1qdummy")


def test_signet_hrp_alias_accepted():
    program = "22" * 20
    addr = calc._bech32_encode("tbs", 0, bytes.fromhex(program))
    assert calc.address_to_scriptpubkey(addr).startswith("0014")


def test_p2sh_p2wpkh_scriptpubkey():
    h160 = GENESIS_HASH160
    redeem = "0014" + h160
    rs_h160 = calc.hash160_hex(redeem)
    addr = calc.hash160_to_p2sh_address(rs_h160, "mainnet")
    assert calc.address_to_scriptpubkey(addr) == "a914" + rs_h160 + "87"


def test_p2sh_p2wsh_scriptpubkey():
    wsh = "00" * 32
    redeem = "0020" + wsh
    rs_h160 = calc.hash160_hex(redeem)
    addr = calc.hash160_to_p2sh_address(rs_h160, "mainnet")
    assert calc.address_to_scriptpubkey(addr) == "a914" + rs_h160 + "87"


def test_script_verification_unknown_flag_raises():
    tx_hex = build_sample_tx_hex()
    with pytest.raises(ValueError, match="Unknown flag: 'NOPE'"):
        calc.script_verification(["", "51", tx_hex, 0, "NOPE"])


def test_script_verification_excluding_witness_clears_dependents():
    tx_hex = build_sample_tx_hex()
    result = json.loads(calc.script_verification(["", "51", tx_hex, 0, "WITNESS"]))
    assert set(result["excludedFlags"]) == {
        "DISCOURAGE_UPGRADABLE_WITNESS_PROGRAM",
        "WITNESS",
        "WITNESS_PUBKEYTYPE",
    }
    assert "WITNESS_PUBKEYTYPE" not in result["activeFlags"]
    assert result["usesWitness"] is False


def test_script_verification_witness_missing_amount_hints():
    tx_hex = build_sample_tx_hex()
    result = json.loads(calc.script_verification(["51", "00", tx_hex, 0, ""]))
    assert result["usesWitness"] is True
    assert result["isValid"] is False
    assert "requires the spent amount" in result.get("error", "")


def test_script_verification_witness_amount_echo():
    tx_hex = build_sample_tx_hex()
    amount = 1234
    result = json.loads(
        calc.script_verification(["", "51", tx_hex, 0, "", str(amount)])
    )
    assert result["usesWitness"] is True
    assert result.get("amountUsed") == amount


def test_script_verification_p2wsh_op_true_succeeds():
    tx, script_pubkey_hex, witness_script = build_p2wsh_op_true_tx()
    tx_hex = b2x(tx.serialize())

    result = json.loads(
        calc.script_verification(["", script_pubkey_hex, tx_hex, 0, "", "1000"])
    )

    assert result["isValid"] is True
    assert result["usesWitness"] is True
    assert any(step.get("phase") == "witnessScript" for step in result["steps"])
    assert result.get("amountUsed") == 1000


def test_encode_script_push_data_big_boundaries():
    assert calc.encode_script_push_data("00" * 75) == "4b"
    assert calc.encode_script_push_data("00" * 255) == "4cff"
    assert calc.encode_script_push_data("00" * 256) == "4d0001"
    assert calc.encode_script_push_data("00" * 65535) == "4dffff"
    assert calc.encode_script_push_data("00" * 65536) == "4e00000100"


def test_int_to_script_bytes_signbit_boundary():
    assert calc.int_to_script_bytes(127) == "7f"
    assert calc.int_to_script_bytes(128) == "8000"


def test_satoshi_to_8_le_extremes():
    assert calc.satoshi_to_8_le(0) == "0000000000000000"
    assert calc.satoshi_to_8_le(2**64 - 1) == "ffffffffffffffff"
    with pytest.raises(ValueError):
        calc.satoshi_to_8_le(-1)


def test_encode_varint_blank_and_none():
    assert calc.encode_varint("") == "00"
    assert calc.encode_varint(None) == "00"


def test_varint_encoded_byte_length_big_boundaries():
    assert calc.varint_encoded_byte_length("00" * 65535) == "fdffff"
    assert calc.varint_encoded_byte_length("00" * 65536) == "fe00000100"


def test_sha256_to_p2wsh_address_wrong_length():
    with pytest.raises(ValueError, match="SHA256 must be exactly 32 bytes"):
        calc.sha256_to_p2wsh_address("00" * 60, "mainnet")


def test_blocks_to_sequence_number_upper_bound():
    with pytest.raises(ValueError, match="Block delay must be <= 65535"):
        calc.blocks_to_sequence_number(65536)


def test_hex_byte_length_odd_rejected():
    with pytest.raises(ValueError, match="even number of characters"):
        calc.hex_byte_length("0ff")


def test_public_key_from_private_key_invalid_inputs():
    with pytest.raises(ValueError, match="exactly 32 bytes"):
        calc.public_key_from_private_key("00" * 31)
    with pytest.raises(ValueError, match=r"range \[1, n-1\]"):
        calc.public_key_from_private_key("00" * 32)
    with pytest.raises(ValueError, match=r"\*even\* number"):
        calc.public_key_from_private_key("abc")


def test_verify_signature_negative_case():
    sig = calc.sign_as_bitcoin_core_low_r([SAMPLE_PRIV_KEY, SAMPLE_MSG_HASH])
    pub = calc.public_key_from_private_key(SAMPLE_PRIV_KEY)
    bad_hash = "11" * 32
    assert calc.verify_signature([pub, bad_hash, sig]) == "false"


def test_verify_signature_invalid_der_raises():
    pub = calc.public_key_from_private_key(SAMPLE_PRIV_KEY)
    with pytest.raises(ValueError, match="Invalid DER signature"):
        calc.verify_signature([pub, SAMPLE_MSG_HASH, "30"])


def test_sign_verify_is_thread_safe():
    pub = calc.public_key_from_private_key(SAMPLE_PRIV_KEY)

    def _work(i: int) -> str:
        msg = f"{i:064x}"
        sig = calc.sign_as_bitcoin_core_low_r([SAMPLE_PRIV_KEY, msg])
        return calc.verify_signature([pub, msg, sig])

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(_work, range(32)))

    assert all(res == "true" for res in results)


def test_hours_to_sequence_number_ties_to_even():
    hours = (10.5 * 512.0) / 3600.0
    assert calc.hours_to_sequence_number(hours) == 10


@given(st.binary(min_size=1, max_size=64))
def test_b58check_roundtrip_fuzz(payload: bytes):
    encoded = calc._b58check_encode(payload)
    assert calc._b58check_decode(encoded) == payload


@st.composite
def _witness_programs(draw):
    hrp = draw(st.sampled_from(["bc", "tb", "bcrt"]))
    version = draw(st.integers(min_value=0, max_value=16))

    if version == 0:
        length = draw(st.sampled_from([20, 32]))
    elif version == 1:
        length = 32
    else:
        length = draw(st.integers(min_value=2, max_value=40))

    program = draw(st.binary(min_size=length, max_size=length))
    return hrp, version, program


@given(_witness_programs())
def test_bech32_roundtrip_property(params):
    hrp, version, program = params
    addr = calc._bech32_encode(hrp, version, program)
    decoded_hrp, decoded_version, decoded_prog = calc._bech32_decode(addr)
    assert decoded_hrp == hrp
    assert decoded_version == version
    assert bytes(decoded_prog) == program


@st.composite
def _hex_with_whitespace(draw):
    raw = draw(st.binary(min_size=0, max_size=32))
    if not raw:
        return ""
    chunks = [f"{byte:02x}" for byte in raw]
    separators = st.sampled_from(["", " ", "\n", "\t"])
    pieces = []
    for chunk in chunks:
        pieces.append(chunk + draw(separators))
    return "".join(pieces)


@given(_hex_with_whitespace())
def test_hex_byte_length_matches_python(hex_string: str):
    cleaned = "".join(hex_string.split())
    expected = len(cleaned) // 2
    assert calc.hex_byte_length(hex_string) == expected
