import pytest

pytest.importorskip("bitcointx")
pytest.importorskip("secp256k1")
pytest.importorskip("ecdsa")

from backend import routes
from backend.calc_functions import calc_func as calc


@pytest.fixture()
def client():
    routes.app.config["TESTING"] = True
    routes.limiter.reset()
    with routes.app.test_client() as client:
        yield client


def test_bulk_calculate_handles_html_injection(client):
    payload = {
        "nodes": [
            {
                "id": "n1",
                "data": {
                    "functionName": "identity",
                    "value": "<script>alert(1)</script>",
                    "dirty": True,
                },
            }
        ],
        "edges": [],
        "version": 1,
    }

    resp = client.post("/bulk_calculate", json=payload)
    assert resp.status_code == 200

    data = resp.get_json()
    node = data["nodes"][0]["data"]
    assert node["result"] == "<script>alert(1)</script>"
    assert node["inputs"]["val"] == "<script>alert(1)</script>"


def test_bulk_calculate_rejects_unknown_function(client):
    payload = {
        "nodes": [
            {
                "id": "n1",
                "data": {
                    "functionName": "__import__('os').system('true')",
                    "dirty": True,
                },
            }
        ],
        "edges": [],
        "version": 1,
    }

    resp = client.post("/bulk_calculate", json=payload)
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["errors"][0]["error"].startswith("No function")


def test_address_to_scriptpubkey_rejects_large_base58_payload():
    payload = b"\x00" + b"\x00" * 64
    addr = calc._b58check_encode(payload)
    with pytest.raises(ValueError, match="Invalid Base58 payload length"):
        calc.address_to_scriptpubkey(addr)


def test_bech32_encode_rejects_oversized_program():
    program = b"\x00" * 41
    with pytest.raises(ValueError, match="Invalid witness program length"):
        calc._bech32_encode("tb", 2, program)


def test_encode_varint_rejects_values_above_uint64():
    with pytest.raises(ValueError, match=r"cannot exceed 2\^64-1"):
        calc.encode_varint(2**64)
